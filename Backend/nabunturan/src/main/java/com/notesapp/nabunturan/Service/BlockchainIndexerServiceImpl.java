package com.notesapp.nabunturan.Service;

import com.notesapp.nabunturan.Config.BlockfrostConfig;
import com.notesapp.nabunturan.Config.IndexerConfig;
import com.notesapp.nabunturan.DTO.*;
import com.notesapp.nabunturan.Entity.BlockchainTransaction;
import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Entity.TransactionStatus;
import com.notesapp.nabunturan.Entity.TransactionType;
import com.notesapp.nabunturan.Repository.BlockchainTransactionRepository;
import com.notesapp.nabunturan.Repository.NoteRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

/**
 * Implementation of BlockchainIndexerService.
 * Handles blockchain scanning, transaction processing, and metadata extraction.
 * 
 * According to backend rules:
 * - Annotated with @Service
 * - Implements service interface
 * - All dependencies autowired
 * - Returns DTOs, not entities
 * - Uses @Transactional for database operations
 */
@Service
public class BlockchainIndexerServiceImpl implements BlockchainIndexerService {

    private static final Logger logger = LoggerFactory.getLogger(BlockchainIndexerServiceImpl.class);

    private final BlockchainTransactionRepository blockchainTransactionRepository;
    private final NoteRepository noteRepository;
    private final BlockfrostClient blockfrostClient;
    private final IndexerConfig indexerConfig;
    private final BlockfrostConfig blockfrostConfig;

    // Indexer state management
    private boolean running = false;
    private Long latestIndexedBlock = 0L;
    private Long totalTransactionsIndexed = 0L;
    private LocalDateTime startedAt = null;
    private LocalDateTime lastIndexedAt = null;
    private String lastError = null;

    public BlockchainIndexerServiceImpl(
            BlockchainTransactionRepository blockchainTransactionRepository,
            NoteRepository noteRepository,
            BlockfrostClient blockfrostClient,
            IndexerConfig indexerConfig,
            BlockfrostConfig blockfrostConfig) {
        this.blockchainTransactionRepository = blockchainTransactionRepository;
        this.noteRepository = noteRepository;
        this.blockfrostClient = blockfrostClient;
        this.indexerConfig = indexerConfig;
        this.blockfrostConfig = blockfrostConfig;
    }

    @PostConstruct
    public void init() {
        logger.info("Initializing BlockchainIndexerService");
        
        if (indexerConfig.isEnabled() && indexerConfig.isConfigured()) {
            logger.info("Indexer is enabled. Configuration: {}", indexerConfig);
            latestIndexedBlock = indexerConfig.getStartSlot();
            
            // Auto-start if enabled
            if (indexerConfig.isEnabled()) {
                startIndexer();
            }
        } else {
            logger.warn("Indexer is disabled or not properly configured");
        }
    }

    @Override
    public void startIndexer() {
        if (running) {
            logger.warn("Indexer is already running");
            return;
        }

        if (!indexerConfig.isEnabled()) {
            logger.error("Cannot start indexer: Indexer is disabled in configuration");
            return;
        }

        if (!blockfrostClient.isConfigured()) {
            logger.error("Cannot start indexer: Blockfrost client is not configured");
            lastError = "Blockfrost client not configured";
            return;
        }

        running = true;
        startedAt = LocalDateTime.now();
        lastError = null;
        logger.info("Blockchain indexer started at {}", startedAt);
    }

    @Override
    public void stopIndexer() {
        if (!running) {
            logger.warn("Indexer is not running");
            return;
        }

        running = false;
        logger.info("Blockchain indexer stopped. Total transactions indexed: {}", totalTransactionsIndexed);
    }

    @Override
    public IndexerStatusDto getIndexerStatus() {
        Long currentBlockHeight = null;
        String blockfrostStatus = "UNAVAILABLE";

        try {
            if (blockfrostClient.isConfigured()) {
                BlockDto latestBlock = blockfrostClient.getLatestBlock();
                currentBlockHeight = latestBlock.height();
                blockfrostStatus = "AVAILABLE";
            }
        } catch (Exception e) {
            logger.error("Failed to get latest block: {}", e.getMessage());
            blockfrostStatus = "ERROR: " + e.getMessage();
        }

        // Count transactions by status
        Long pending = blockchainTransactionRepository.countByStatus(TransactionStatus.PENDING);
        Long confirmed = blockchainTransactionRepository.countByStatus(TransactionStatus.CONFIRMED);
        Long failed = blockchainTransactionRepository.countByStatus(TransactionStatus.FAILED);

        // Count monitored addresses
        Integer monitoredAddressesCount = indexerConfig.getMonitorAddresses() != null
                ? indexerConfig.getMonitorAddresses().size()
                : 0;

        return new IndexerStatusDto(
                indexerConfig.isEnabled(),
                running,
                blockfrostConfig.getNetwork(),
                currentBlockHeight,
                latestIndexedBlock,
                lastIndexedAt,
                totalTransactionsIndexed,
                pending,
                confirmed,
                failed,
                monitoredAddressesCount,
                blockfrostStatus,
                startedAt,
                lastError
        );
    }

    @Override
    @Scheduled(fixedDelayString = "${cardano.indexer.poll-interval-seconds:30}000")
    @Transactional
    public int scanBlockchain() {
        if (!running) {
            return 0;
        }

        try {
            logger.debug("Starting blockchain scan...");

            // Get latest block from blockchain
            BlockDto latestBlock = blockfrostClient.getLatestBlock();
            Long currentBlockHeight = latestBlock.height();

            if (currentBlockHeight <= latestIndexedBlock) {
                logger.debug("No new blocks to process");
                return 0;
            }

            int transactionsProcessed = 0;
            List<String> monitorAddresses = indexerConfig.getMonitorAddresses();

            if (monitorAddresses == null || monitorAddresses.isEmpty()) {
                logger.warn("No wallet addresses configured for monitoring");
                return 0;
            }

            // Scan transactions for each monitored address
            for (String address : monitorAddresses) {
                try {
                    List<AddressTransactionDto> addressTxs = blockfrostClient.getAddressTransactions(address, 1);

                    for (AddressTransactionDto addressTx : addressTxs) {
                        // Skip if already indexed
                        if (blockchainTransactionRepository.existsByTxHash(addressTx.getTxHash())) {
                            continue;
                        }

                        // Skip if block height is before our start point
                        if (addressTx.getBlockHeight() < latestIndexedBlock) {
                            continue;
                        }

                        // Process the transaction
                        BlockchainTransactionDto processedTx = processTransactionInternal(addressTx.getTxHash());
                        if (processedTx != null) {
                            transactionsProcessed++;
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error processing transactions for address {}: {}", address, e.getMessage());
                }
            }

            // Update latest indexed block
            latestIndexedBlock = currentBlockHeight;
            lastIndexedAt = LocalDateTime.now();
            totalTransactionsIndexed += transactionsProcessed;
            lastError = null;

            if (transactionsProcessed > 0) {
                logger.info("Blockchain scan completed. Processed {} transactions. Latest block: {}",
                        transactionsProcessed, latestIndexedBlock);
            }

            return transactionsProcessed;

        } catch (Exception e) {
            logger.error("Error during blockchain scan: {}", e.getMessage(), e);
            lastError = "Scan error: " + e.getMessage();
            return 0;
        }
    }

    @Override
    @Transactional
    public BlockchainTransactionDto processTransaction(String txHash) {
        try {
            return processTransactionInternal(txHash);
        } catch (Exception e) {
            logger.error("Error processing transaction {}: {}", txHash, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Internal method to process a transaction and store it in the database.
     * 
     * @param txHash Transaction hash
     * @return BlockchainTransactionDto if successful, null otherwise
     */
    @Transactional
    private BlockchainTransactionDto processTransactionInternal(String txHash) {
        try {
            // Check if already indexed
            if (blockchainTransactionRepository.existsByTxHash(txHash)) {
                logger.debug("Transaction {} already indexed", txHash);
                return DtoMapper.toBlockchainTransactionDto(
                        blockchainTransactionRepository.findByTxHash(txHash).orElse(null)
                );
            }

            // Get transaction details from Blockfrost
            TransactionDetailsDto txDetails = blockfrostClient.getTransactionDetails(txHash);

            if (txDetails == null) {
                logger.warn("Transaction {} not found in blockchain", txHash);
                return null;
            }

            // Check if transaction has metadata
            if (!txDetails.hasMetadata()) {
                logger.debug("Transaction {} has no metadata, skipping", txHash);
                return null;
            }

            // Extract metadata
            List<TransactionMetadataDto> metadataList = txDetails.metadata();
            Integer targetLabel = indexerConfig.getMetadataLabel();

            TransactionMetadataDto noteMetadata = null;
            for (TransactionMetadataDto metadata : metadataList) {
                if (metadata.hasLabel(targetLabel)) {
                    noteMetadata = metadata;
                    break;
                }
            }

            if (noteMetadata == null) {
                logger.debug("Transaction {} has no metadata with label {}", txHash, targetLabel);
                return null;
            }

            // Parse note metadata
            Map<String, Object> metadataMap = noteMetadata.getMetadataAsMap();
            if (metadataMap == null) {
                logger.warn("Failed to parse metadata for transaction {}", txHash);
                return null;
            }

            // Extract transaction information
            String action = (String) metadataMap.get("action");
            if (action == null) {
                logger.warn("No action specified in metadata for transaction {}", txHash);
                return null;
            }

            TransactionType transactionType = parseTransactionType(action);
            if (transactionType == null) {
                logger.warn("Unknown action '{}' in transaction {}", action, txHash);
                return null;
            }

            // Get wallet address from metadata or transaction inputs
            String walletAddress = (String) metadataMap.get("walletAddress");
            if (walletAddress == null || walletAddress.isBlank()) {
                logger.warn("No wallet address in metadata for transaction {}", txHash);
                return null;
            }

            // Create blockchain transaction entity
            BlockchainTransaction transaction = new BlockchainTransaction();
            transaction.setTxHash(txHash);
            transaction.setBlockHeight(txDetails.getBlockHeight());
            transaction.setBlockTime(LocalDateTime.ofEpochSecond(txDetails.getBlockTime(), 0, ZoneOffset.UTC));
            transaction.setType(transactionType);
            transaction.setStatus(TransactionStatus.CONFIRMED); // From blockchain, so confirmed
            transaction.setWalletAddress(walletAddress);
            transaction.setMetadata(noteMetadata.toJson());
            transaction.setConfirmations(calculateConfirmations(txDetails.getBlockHeight()));

            // Process based on transaction type
            Note note = processNoteFromMetadata(metadataMap, transactionType, walletAddress, transaction);

            if (note != null) {
                transaction.setNote(note);
            }

            // Save transaction
            BlockchainTransaction savedTransaction = blockchainTransactionRepository.save(transaction);

            logger.info("Successfully processed transaction {} of type {} for wallet {}",
                    txHash, transactionType, walletAddress);

            return DtoMapper.toBlockchainTransactionDto(savedTransaction);

        } catch (Exception e) {
            logger.error("Error processing transaction {}: {}", txHash, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Process note data from transaction metadata.
     * Creates or updates note based on transaction type.
     * 
     * @param metadataMap Transaction metadata as map
     * @param transactionType Type of transaction (CREATE, UPDATE, DELETE)
     * @param walletAddress Wallet address
     * @param transaction The blockchain transaction
     * @return Note entity (created or updated)
     */
    @Transactional
    private Note processNoteFromMetadata(
            Map<String, Object> metadataMap,
            TransactionType transactionType,
            String walletAddress,
            BlockchainTransaction transaction) {

        try {
            switch (transactionType) {
                case CREATE:
                    return createNoteFromMetadata(metadataMap, walletAddress, transaction.getTxHash());

                case UPDATE:
                    return updateNoteFromMetadata(metadataMap, walletAddress, transaction.getTxHash());

                case DELETE:
                    return markNoteAsDeleted(metadataMap, walletAddress);

                default:
                    logger.warn("Unknown transaction type: {}", transactionType);
                    return null;
            }
        } catch (Exception e) {
            logger.error("Error processing note from metadata: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Create a new note from transaction metadata.
     */
    @Transactional
    private Note createNoteFromMetadata(Map<String, Object> metadataMap, String walletAddress, String txHash) {
        String title = (String) metadataMap.get("title");
        String content = (String) metadataMap.get("content");
        String category = (String) metadataMap.get("category");
        Boolean isPinned = (Boolean) metadataMap.getOrDefault("isPinned", false);

        if (title == null || title.isBlank()) {
            logger.warn("Cannot create note: title is missing");
            return null;
        }

        Note note = new Note();
        note.setTitle(title);
        note.setContent(content != null ? content : "");
        note.setCategory(category);
        note.setPinned(isPinned);
        note.setCreatedByWallet(walletAddress);
        note.setOnChain(true);
        note.setLatestTxHash(txHash);

        Note savedNote = noteRepository.save(note);
        logger.info("Created note {} from blockchain transaction {}", savedNote.getId(), txHash);

        return savedNote;
    }

    /**
     * Update an existing note from transaction metadata.
     */
    @Transactional
    private Note updateNoteFromMetadata(Map<String, Object> metadataMap, String walletAddress, String txHash) {
        Object noteIdObj = metadataMap.get("noteId");
        if (noteIdObj == null) {
            logger.warn("Cannot update note: noteId is missing");
            return null;
        }

        Long noteId = null;
        if (noteIdObj instanceof Number) {
            noteId = ((Number) noteIdObj).longValue();
        } else if (noteIdObj instanceof String) {
            try {
                noteId = Long.parseLong((String) noteIdObj);
            } catch (NumberFormatException e) {
                logger.warn("Invalid noteId format: {}", noteIdObj);
                return null;
            }
        }

        if (noteId == null) {
            return null;
        }

        Note note = noteRepository.findById(noteId).orElse(null);
        if (note == null) {
            logger.warn("Note {} not found for update", noteId);
            return null;
        }

        // Verify wallet ownership
        if (!walletAddress.equals(note.getCreatedByWallet())) {
            logger.warn("Wallet {} does not own note {}", walletAddress, noteId);
            return null;
        }

        // Update note fields
        String title = (String) metadataMap.get("title");
        String content = (String) metadataMap.get("content");
        String category = (String) metadataMap.get("category");
        Boolean isPinned = (Boolean) metadataMap.get("isPinned");

        if (title != null) {
            note.setTitle(title);
        }
        if (content != null) {
            note.setContent(content);
        }
        if (category != null) {
            note.setCategory(category);
        }
        if (isPinned != null) {
            note.setPinned(isPinned);
        }

        note.setLatestTxHash(txHash);
        Note savedNote = noteRepository.save(note);

        logger.info("Updated note {} from blockchain transaction {}", noteId, txHash);
        return savedNote;
    }

    /**
     * Mark a note as deleted (soft delete from blockchain).
     */
    @Transactional
    private Note markNoteAsDeleted(Map<String, Object> metadataMap, String walletAddress) {
        Object noteIdObj = metadataMap.get("noteId");
        if (noteIdObj == null) {
            logger.warn("Cannot delete note: noteId is missing");
            return null;
        }

        Long noteId = null;
        if (noteIdObj instanceof Number) {
            noteId = ((Number) noteIdObj).longValue();
        } else if (noteIdObj instanceof String) {
            try {
                noteId = Long.parseLong((String) noteIdObj);
            } catch (NumberFormatException e) {
                logger.warn("Invalid noteId format: {}", noteIdObj);
                return null;
            }
        }

        if (noteId == null) {
            return null;
        }

        Note note = noteRepository.findById(noteId).orElse(null);
        if (note == null) {
            logger.warn("Note {} not found for deletion", noteId);
            return null;
        }

        // Verify wallet ownership
        if (!walletAddress.equals(note.getCreatedByWallet())) {
            logger.warn("Wallet {} does not own note {}", walletAddress, noteId);
            return null;
        }

        // Soft delete: mark as not on-chain
        note.setOnChain(false);
        Note savedNote = noteRepository.save(note);

        logger.info("Marked note {} as deleted from blockchain", noteId);
        return savedNote;
    }

    /**
     * Parse transaction type from action string.
     */
    private TransactionType parseTransactionType(String action) {
        if (action == null) {
            return null;
        }

        return switch (action.toUpperCase()) {
            case "CREATE", "ADD", "NEW" -> TransactionType.CREATE;
            case "UPDATE", "EDIT", "MODIFY" -> TransactionType.UPDATE;
            case "DELETE", "REMOVE" -> TransactionType.DELETE;
            default -> null;
        };
    }

    /**
     * Calculate number of confirmations for a transaction.
     */
    private Integer calculateConfirmations(Long blockHeight) {
        try {
            BlockDto latestBlock = blockfrostClient.getLatestBlock();
            Long currentHeight = latestBlock.height();
            return Math.toIntExact(currentHeight - blockHeight + 1);
        } catch (Exception e) {
            logger.warn("Failed to calculate confirmations: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public List<BlockchainTransactionDto> getTransactionsByWallet(String walletAddress) {
        List<BlockchainTransaction> transactions = blockchainTransactionRepository.findByWalletAddress(walletAddress);
        return DtoMapper.toBlockchainTransactionDtoList(transactions);
    }

    @Override
    public List<BlockchainTransactionDto> getPendingTransactions() {
        List<BlockchainTransaction> pending = blockchainTransactionRepository.findPendingTransactions();
        return DtoMapper.toBlockchainTransactionDtoList(pending);
    }

    @Override
    @Transactional
    public int updatePendingTransactions() {
        List<BlockchainTransaction> pendingTransactions = blockchainTransactionRepository.findPendingTransactions();
        int updated = 0;

        for (BlockchainTransaction transaction : pendingTransactions) {
            try {
                TransactionDetailsDto txDetails = blockfrostClient.getTransactionDetails(transaction.getTxHash());
                if (txDetails != null) {
                    transaction.setStatus(TransactionStatus.CONFIRMED);
                    transaction.setBlockHeight(txDetails.getBlockHeight());
                    transaction.setBlockTime(LocalDateTime.ofEpochSecond(txDetails.getBlockTime(), 0, ZoneOffset.UTC));
                    transaction.setConfirmations(calculateConfirmations(txDetails.getBlockHeight()));
                    blockchainTransactionRepository.save(transaction);
                    updated++;
                }
            } catch (Exception e) {
                logger.error("Failed to update transaction {}: {}", transaction.getTxHash(), e.getMessage());
            }
        }

        logger.info("Updated {} pending transactions", updated);
        return updated;
    }

    @Override
    @Transactional
    public int reindexFromBlock(Long fromBlock) {
        if (!running) {
            logger.warn("Cannot reindex: indexer is not running");
            return 0;
        }

        logger.info("Starting reindex from block {}", fromBlock);
        latestIndexedBlock = fromBlock;
        return scanBlockchain();
    }

    @Override
    public List<BlockchainTransactionDto> getNoteTransactionHistory(Long noteId) {
        List<BlockchainTransaction> transactions = blockchainTransactionRepository.findByNoteId(noteId);
        return DtoMapper.toBlockchainTransactionDtoList(transactions);
    }
}

