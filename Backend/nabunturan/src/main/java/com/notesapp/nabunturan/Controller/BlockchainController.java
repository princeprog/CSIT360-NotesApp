package com.notesapp.nabunturan.Controller;

import com.notesapp.nabunturan.DTO.BlockchainTransactionDto;
import com.notesapp.nabunturan.DTO.CreatePendingTransactionRequest;
import com.notesapp.nabunturan.DTO.DtoMapper;
import com.notesapp.nabunturan.DTO.IndexerStatusDto;
import com.notesapp.nabunturan.DTO.SubmitTransactionRequest;
import com.notesapp.nabunturan.Entity.BlockchainTransaction;
import com.notesapp.nabunturan.Entity.TransactionStatus;
import com.notesapp.nabunturan.Repository.BlockchainTransactionRepository;
import com.notesapp.nabunturan.Response.ApiResponse;
import com.notesapp.nabunturan.Service.BlockchainIndexerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for blockchain-related operations.
 * Provides endpoints for indexer control, status monitoring, and transaction queries.
 *
 * According to backend rules:
 * - @RestController annotation
 * - Constructor injection for dependencies
 * - Try-catch blocks for error handling
 * - Returns ResponseEntity<ApiResponse<T>>
 * - Uses DTOs for responses
 * - Calls service methods (not repositories directly)
 */
@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "*")
public class BlockchainController {

    private static final Logger logger = LoggerFactory.getLogger(BlockchainController.class);

    private final BlockchainIndexerService blockchainIndexerService;
    private final BlockchainTransactionRepository blockchainTransactionRepository;

    /**
     * Constructor with dependency injection
     */
    public BlockchainController(
            BlockchainIndexerService blockchainIndexerService,
            BlockchainTransactionRepository blockchainTransactionRepository) {
        this.blockchainIndexerService = blockchainIndexerService;
        this.blockchainTransactionRepository = blockchainTransactionRepository;
    }

    // ========== INDEXER CONTROL ENDPOINTS ==========

    /**
     * Start the blockchain indexer.
     * POST /api/blockchain/indexer/start
     *
     * @return ApiResponse with success or error message
     */
    @PostMapping("/indexer/start")
    public ResponseEntity<ApiResponse<String>> startIndexer() {
        try {
            logger.info("Starting blockchain indexer via API");
            blockchainIndexerService.startIndexer();
            return new ResponseEntity<>(
                    ApiResponse.success("Blockchain indexer started successfully.", "Indexer is now running."),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error starting blockchain indexer: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to start blockchain indexer: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Stop the blockchain indexer.
     * POST /api/blockchain/indexer/stop
     *
     * @return ApiResponse with success or error message
     */
    @PostMapping("/indexer/stop")
    public ResponseEntity<ApiResponse<String>> stopIndexer() {
        try {
            logger.info("Stopping blockchain indexer via API");
            blockchainIndexerService.stopIndexer();
            return new ResponseEntity<>(
                    ApiResponse.success("Blockchain indexer stopped successfully.", "Indexer is now stopped."),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error stopping blockchain indexer: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to stop blockchain indexer: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get the current status of the blockchain indexer.
     * GET /api/blockchain/indexer/status
     *
     * @return ApiResponse with IndexerStatusDto
     */
    @GetMapping("/indexer/status")
    public ResponseEntity<ApiResponse<IndexerStatusDto>> getIndexerStatus() {
        try {
            logger.debug("Fetching blockchain indexer status via API");
            IndexerStatusDto status = blockchainIndexerService.getIndexerStatus();
            return new ResponseEntity<>(
                    ApiResponse.success("Indexer status retrieved successfully.", status),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error fetching blockchain indexer status: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to fetch indexer status: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Manually trigger a blockchain indexing scan.
     * POST /api/blockchain/indexer/scan
     *
     * @return ApiResponse with success or error message
     */
    @PostMapping("/indexer/scan")
    public ResponseEntity<ApiResponse<Integer>> triggerScan() {
        try {
            logger.info("Manually triggering blockchain indexing scan via API");
            int transactionsProcessed = blockchainIndexerService.scanBlockchain();
            return new ResponseEntity<>(
                    ApiResponse.success(
                            String.format("Blockchain indexing scan completed successfully. Processed %d transactions.", transactionsProcessed),
                            transactionsProcessed
                    ),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error triggering blockchain indexing scan: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to trigger indexing scan: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Reindex blockchain from a specific block height.
     * POST /api/blockchain/indexer/reindex?startBlock={blockHeight}
     *
     * @param startBlock Starting block height for reindexing
     * @return ApiResponse with number of transactions reindexed
     */
    @PostMapping("/indexer/reindex")
    public ResponseEntity<ApiResponse<Integer>> reindexFromBlock(
            @RequestParam Long startBlock) {
        try {
            logger.info("Reindexing blockchain from block {} via API", startBlock);
            if (startBlock == null || startBlock < 0) {
                return new ResponseEntity<>(
                        ApiResponse.error("Start block must be a non-negative number."),
                        HttpStatus.BAD_REQUEST
                );
            }
            int transactionsReindexed = blockchainIndexerService.reindexFromBlock(startBlock);
            return new ResponseEntity<>(
                    ApiResponse.success(
                            String.format("Blockchain reindexed successfully from block %d. Processed %d transactions.", startBlock, transactionsReindexed),
                            transactionsReindexed
                    ),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error reindexing blockchain: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to reindex blockchain: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ========== TRANSACTION QUERY ENDPOINTS ==========

    /**
     * Get all blockchain transactions for a specific wallet address.
     * GET /api/blockchain/transactions/wallet/{address}
     *
     * @param address Wallet address (Cardano bech32 format)
     * @return ApiResponse with list of BlockchainTransactionDto
     */
    @GetMapping("/transactions/wallet/{address}")
    public ResponseEntity<ApiResponse<List<BlockchainTransactionDto>>> getTransactionsByWallet(
            @PathVariable String address) {
        try {
            logger.debug("Fetching blockchain transactions for wallet: {}", address);
            if (address == null || address.isBlank()) {
                return new ResponseEntity<>(
                        ApiResponse.error("Wallet address cannot be empty."),
                        HttpStatus.BAD_REQUEST
                );
            }
            List<BlockchainTransaction> transactions = blockchainTransactionRepository.findByWalletAddress(address);
            List<BlockchainTransactionDto> transactionDtos = DtoMapper.toBlockchainTransactionDtoList(transactions);
            return new ResponseEntity<>(
                    ApiResponse.success("Transactions retrieved successfully.", transactionDtos),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error fetching transactions for wallet {}: {}", address, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to fetch transactions: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get blockchain transaction history for a specific note.
     * GET /api/blockchain/transactions/note/{noteId}
     *
     * @param noteId Note ID
     * @return ApiResponse with list of BlockchainTransactionDto
     */
    @GetMapping("/transactions/note/{noteId}")
    public ResponseEntity<ApiResponse<List<BlockchainTransactionDto>>> getTransactionsByNote(
            @PathVariable Long noteId) {
        try {
            logger.debug("Fetching blockchain transactions for note ID: {}", noteId);
            if (noteId == null || noteId <= 0) {
                return new ResponseEntity<>(
                        ApiResponse.error("Note ID must be a positive number."),
                        HttpStatus.BAD_REQUEST
                );
            }
            List<BlockchainTransaction> transactions = blockchainTransactionRepository.findByNoteId(noteId);
            List<BlockchainTransactionDto> transactionDtos = DtoMapper.toBlockchainTransactionDtoList(transactions);
            return new ResponseEntity<>(
                    ApiResponse.success("Transactions retrieved successfully.", transactionDtos),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error fetching transactions for note {}: {}", noteId, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to fetch transactions: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get all pending blockchain transactions.
     * GET /api/blockchain/transactions/pending
     *
     * @return ApiResponse with list of BlockchainTransactionDto
     */
    @GetMapping("/transactions/pending")
    public ResponseEntity<ApiResponse<List<BlockchainTransactionDto>>> getPendingTransactions() {
        try {
            logger.debug("Fetching pending blockchain transactions");
            List<BlockchainTransaction> transactions = blockchainTransactionRepository.findPendingTransactions();
            List<BlockchainTransactionDto> transactionDtos = DtoMapper.toBlockchainTransactionDtoList(transactions);
            return new ResponseEntity<>(
                    ApiResponse.success("Pending transactions retrieved successfully.", transactionDtos),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error fetching pending transactions: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to fetch pending transactions: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get all confirmed blockchain transactions for a specific wallet.
     * GET /api/blockchain/transactions/wallet/{address}/confirmed
     *
     * @param address Wallet address
     * @return ApiResponse with list of BlockchainTransactionDto
     */
    @GetMapping("/transactions/wallet/{address}/confirmed")
    public ResponseEntity<ApiResponse<List<BlockchainTransactionDto>>> getConfirmedTransactionsByWallet(
            @PathVariable String address) {
        try {
            logger.debug("Fetching confirmed blockchain transactions for wallet: {}", address);
            if (address == null || address.isBlank()) {
                return new ResponseEntity<>(
                        ApiResponse.error("Wallet address cannot be empty."),
                        HttpStatus.BAD_REQUEST
                );
            }
            List<BlockchainTransaction> transactions = blockchainTransactionRepository.findConfirmedTransactionsByWallet(address);
            List<BlockchainTransactionDto> transactionDtos = DtoMapper.toBlockchainTransactionDtoList(transactions);
            return new ResponseEntity<>(
                    ApiResponse.success("Confirmed transactions retrieved successfully.", transactionDtos),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error fetching confirmed transactions for wallet {}: {}", address, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to fetch confirmed transactions: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get a specific blockchain transaction by transaction hash.
     * GET /api/blockchain/transactions/{txHash}
     *
     * @param txHash Transaction hash
     * @return ApiResponse with BlockchainTransactionDto
     */
    @GetMapping("/transactions/{txHash}")
    public ResponseEntity<ApiResponse<BlockchainTransactionDto>> getTransactionByHash(
            @PathVariable String txHash) {
        try {
            logger.debug("Fetching blockchain transaction by hash: {}", txHash);
            if (txHash == null || txHash.isBlank()) {
                return new ResponseEntity<>(
                        ApiResponse.error("Transaction hash cannot be empty."),
                        HttpStatus.BAD_REQUEST
                );
            }
            Optional<BlockchainTransaction> transactionOpt = blockchainTransactionRepository.findByTxHash(txHash);
            if (transactionOpt.isEmpty()) {
                return new ResponseEntity<>(
                        ApiResponse.error("Transaction not found with hash: " + txHash),
                        HttpStatus.NOT_FOUND
                );
            }
            BlockchainTransactionDto transactionDto = DtoMapper.toBlockchainTransactionDto(transactionOpt.get());
            return new ResponseEntity<>(
                    ApiResponse.success("Transaction retrieved successfully.", transactionDto),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error fetching transaction by hash {}: {}", txHash, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to fetch transaction: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get count of transactions by status.
     * GET /api/blockchain/transactions/count/status/{status}
     *
     * @param status Transaction status (PENDING, MEMPOOL, CONFIRMED, FAILED)
     * @return ApiResponse with count
     */
    @GetMapping("/transactions/count/status/{status}")
    public ResponseEntity<ApiResponse<Long>> getTransactionCountByStatus(
            @PathVariable String status) {
        try {
            logger.debug("Fetching transaction count for status: {}", status);
            TransactionStatus transactionStatus = TransactionStatus.valueOf(status.toUpperCase());
            Long count = blockchainTransactionRepository.countByStatus(transactionStatus);
            return new ResponseEntity<>(
                    ApiResponse.success("Transaction count retrieved successfully.", count),
                    HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid transaction status: {}", status);
            return new ResponseEntity<>(
                    ApiResponse.error("Invalid transaction status: " + status + ". Valid values are: PENDING, MEMPOOL, CONFIRMED, FAILED."),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            logger.error("Error fetching transaction count for status {}: {}", status, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to fetch transaction count: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Check if a transaction exists by hash.
     * GET /api/blockchain/transactions/{txHash}/exists
     *
     * @param txHash Transaction hash
     * @return ApiResponse with boolean result
     */
    @GetMapping("/transactions/{txHash}/exists")
    public ResponseEntity<ApiResponse<Boolean>> checkTransactionExists(
            @PathVariable String txHash) {
        try {
            logger.debug("Checking if transaction exists: {}", txHash);
            if (txHash == null || txHash.isBlank()) {
                return new ResponseEntity<>(
                        ApiResponse.error("Transaction hash cannot be empty."),
                        HttpStatus.BAD_REQUEST
                );
            }
            boolean exists = blockchainTransactionRepository.existsByTxHash(txHash);
            return new ResponseEntity<>(
                    ApiResponse.success("Transaction existence check completed.", exists),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error checking transaction existence for {}: {}", txHash, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to check transaction existence: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ========== PENDING TRANSACTION MANAGEMENT ENDPOINTS ==========

    /**
     * Create a pending blockchain transaction.
     * POST /api/blockchain/transactions/pending
     * 
     * Used by YONG after building transaction but before blockchain submission.
     * Saves transaction with status=PENDING for tracking.
     * 
     * Workflow:
     * 1. Frontend (YONG) builds transaction with Cardano metadata
     * 2. Calls this endpoint to save pending transaction
     * 3. Gets back transaction ID for tracking
     * 4. IVAN signs and submits to blockchain
     * 5. IVAN calls updateTransaction Submit with txHash
     * 
     * @param request CreatePendingTransactionRequest with transaction details
     * @return ApiResponse with created BlockchainTransactionDto
     */
    @PostMapping("/transactions/pending")
    public ResponseEntity<ApiResponse<BlockchainTransactionDto>> createPendingTransaction(
            @RequestBody CreatePendingTransactionRequest request) {
        try {
            logger.info("Creating pending transaction for note {} by wallet {}", 
                        request.noteId(), request.walletAddress());
            
            BlockchainTransactionDto transaction = 
                blockchainIndexerService.createPendingTransaction(request);
            
            logger.info("Pending transaction created with ID: {}", transaction.id());
            
            return new ResponseEntity<>(
                    ApiResponse.success(
                            "Pending transaction created successfully. Transaction ID: " + transaction.id(),
                            transaction
                    ),
                    HttpStatus.CREATED
            );
        } catch (IllegalArgumentException e) {
            logger.error("Invalid pending transaction request: {}", e.getMessage());
            return new ResponseEntity<>(
                    ApiResponse.error("Invalid request: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            logger.error("Error creating pending transaction: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to create pending transaction: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Update transaction after blockchain submission.
     * PUT /api/blockchain/transactions/{id}/submit
     * 
     * Called by IVAN after successfully signing and submitting transaction to Cardano.
     * Updates transaction with blockchain hash and changes status to MEMPOOL.
     * 
     * Workflow:
     * 1. IVAN signs pending transaction with Lace wallet
     * 2. IVAN submits signed transaction to Cardano network
     * 3. IVAN receives txHash from blockchain
     * 4. IVAN calls this endpoint with txHash
     * 5. Backend updates transaction status and note's latestTxHash
     * 
     * @param id Internal transaction ID (from createPendingTransaction)
     * @param request Request body with txHash
     * @return ApiResponse with updated BlockchainTransactionDto
     */
    @PutMapping("/transactions/{id}/submit")
    public ResponseEntity<ApiResponse<BlockchainTransactionDto>> submitTransaction(
            @PathVariable Long id,
            @RequestBody SubmitTransactionRequest request) {
        try {
            logger.info("Updating transaction {} with blockchain hash {}", id, request.txHash());
            
            BlockchainTransactionDto transaction = 
                blockchainIndexerService.updateTransactionSubmitted(id, request.txHash());
            
            logger.info("Transaction {} submitted successfully to blockchain", id);
            
            return new ResponseEntity<>(
                    ApiResponse.success(
                            "Transaction submitted successfully. TxHash: " + request.txHash(),
                            transaction
                    ),
                    HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            logger.error("Invalid submit transaction request: {}", e.getMessage());
            return new ResponseEntity<>(
                    ApiResponse.error("Invalid request: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (IllegalStateException e) {
            logger.error("Invalid transaction state: {}", e.getMessage());
            return new ResponseEntity<>(
                    ApiResponse.error(e.getMessage()),
                    HttpStatus.CONFLICT
            );
        } catch (Exception e) {
            logger.error("Error submitting transaction {}: {}", id, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to submit transaction: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    // ========== HEALTH CHECK ENDPOINT ==========

    /**
     * Health check endpoint for blockchain integration.
     * GET /api/blockchain/health
     *
     * @return ApiResponse with health status
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        try {
            IndexerStatusDto status = blockchainIndexerService.getIndexerStatus();
            String healthMessage = String.format(
                    "Blockchain integration is operational. Indexer is %s. Network: %s. Latest block: %s",
                    status.running() ? "running" : "stopped",
                    status.network(),
                    status.latestIndexedBlock()
            );
            return new ResponseEntity<>(
                    ApiResponse.success(healthMessage, "OK"),
                    HttpStatus.OK
            );
        } catch (Exception e) {
            logger.error("Error in blockchain health check: {}", e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Blockchain integration health check failed: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}

