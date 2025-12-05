package com.notesapp.nabunturan.Worker;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Entity.Transaction;
import com.notesapp.nabunturan.Repository.NoteRepository;
import com.notesapp.nabunturan.Service.BlockfrostService;
import com.notesapp.nabunturan.Service.TransactionService;

/**
 * Scheduled worker to sync pending transactions with the Cardano blockchain
 */
@Component
public class TransactionSyncWorker {

    private static final Logger logger = LoggerFactory.getLogger(TransactionSyncWorker.class);

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private BlockfrostService blockfrostService;

    @Autowired
    private NoteRepository noteRepository;

    @Value("${sync.enabled:true}")
    private boolean syncEnabled;

    @Value("${sync.timeout-minutes:10}")
    private long timeoutMinutes;

    @Value("${sync.max-retry-count:5}")
    private int maxRetryCount;

    /**
     * Main sync method that runs periodically to check pending transactions
     * Uses fixedDelayString to read interval from application.properties
     */
    @Scheduled(fixedDelayString = "${sync.interval:300000}")
    public void syncPendingTransactions() {
        if (!syncEnabled) {
            logger.debug("Transaction sync is disabled");
            return;
        }

        logger.info("Starting transaction sync worker...");

        try {
            // Get all pending transactions
            List<Transaction> pendingTransactions = transactionService.getPendingTransactions();
            logger.info("Found {} pending transactions to process", pendingTransactions.size());

            int confirmedCount = 0;
            int failedCount = 0;
            int expiredCount = 0;

            for (Transaction transaction : pendingTransactions) {
                try {
                    // Check if transaction has expired
                    if (isTransactionExpired(transaction)) {
                        logger.warn("Transaction {} has expired", transaction.getTxHash());
                        markTransactionAsFailed(transaction, "Transaction expired - timeout exceeded");
                        expiredCount++;
                        continue;
                    }

                    // Check if max retry count exceeded
                    if (transaction.getRetryCount() >= maxRetryCount) {
                        logger.warn("Transaction {} exceeded max retry count", transaction.getTxHash());
                        markTransactionAsFailed(transaction, "Max retry count exceeded");
                        failedCount++;
                        continue;
                    }

                    // Check transaction status with Blockfrost
                    String txHash = transaction.getTxHash();
                    if (txHash == null || txHash.isEmpty()) {
                        logger.warn("Transaction {} has no tx hash", transaction.getId());
                        markTransactionAsFailed(transaction, "Missing transaction hash");
                        failedCount++;
                        continue;
                    }

                    logger.debug("Checking transaction {} with Blockfrost", txHash);

                    // Query Blockfrost for transaction details
                    boolean isConfirmed = blockfrostService.isTransactionConfirmed(txHash);

                    if (isConfirmed) {
                        // Get full transaction details
                        Map<String, Object> txDetails = blockfrostService.getTransactionDetails(txHash);
                        
                        Long blockHeight = (Long) txDetails.get("block_height");
                        Long blockTimeUnix = (Long) txDetails.get("block_time");
                        LocalDateTime blockTime = blockTimeUnix != null 
                            ? LocalDateTime.ofEpochSecond(blockTimeUnix, 0, java.time.ZoneOffset.UTC)
                            : null;

                        // Update transaction status to CONFIRMED
                        transactionService.updateTransactionStatus(
                            txHash,
                            "CONFIRMED",
                            blockHeight,
                            blockTime
                        );

                        // Update associated note status
                        updateNoteStatus(transaction.getNote().getId(), "CONFIRMED");

                        logger.info("Transaction {} confirmed at block height {}", txHash, blockHeight);
                        confirmedCount++;
                    } else {
                        // Transaction not yet confirmed, increment retry count
                        transaction.setRetryCount(transaction.getRetryCount() + 1);
                        transaction.setLastCheckedAt(LocalDateTime.now());
                        logger.debug("Transaction {} not yet confirmed. Retry count: {}", 
                            txHash, transaction.getRetryCount());
                    }

                } catch (Exception e) {
                    logger.error("Error processing transaction {}: {}", 
                        transaction.getTxHash(), e.getMessage(), e);
                    
                    // Increment retry count on error
                    transaction.setRetryCount(transaction.getRetryCount() + 1);
                    transaction.setLastCheckedAt(LocalDateTime.now());
                    
                    // If it's a "not found" error and retries exceeded, mark as failed
                    if (transaction.getRetryCount() >= maxRetryCount) {
                        markTransactionAsFailed(transaction, "Transaction not found: " + e.getMessage());
                        failedCount++;
                    }
                }
            }

            logger.info("Transaction sync completed. Confirmed: {}, Failed: {}, Expired: {}", 
                confirmedCount, failedCount, expiredCount);

        } catch (Exception e) {
            logger.error("Error in transaction sync worker: {}", e.getMessage(), e);
        }
    }

    /**
     * Check if a transaction has expired based on timeout configuration
     * @param transaction The transaction to check
     * @return true if expired, false otherwise
     */
    private boolean isTransactionExpired(Transaction transaction) {
        if (transaction.getCreatedAt() == null) {
            return false;
        }

        LocalDateTime expirationTime = transaction.getCreatedAt().plusMinutes(timeoutMinutes);
        LocalDateTime now = LocalDateTime.now();

        return now.isAfter(expirationTime);
    }

    /**
     * Mark a transaction as failed with an error message
     * @param transaction The transaction to mark as failed
     * @param errorMessage The error message
     */
    private void markTransactionAsFailed(Transaction transaction, String errorMessage) {
        try {
            transactionService.markTransactionAsFailed(transaction.getTxHash(), errorMessage);
            
            // Update associated note status
            if (transaction.getNote() != null) {
                updateNoteStatus(transaction.getNote().getId(), "FAILED");
            }
            
            logger.info("Marked transaction {} as FAILED: {}", transaction.getTxHash(), errorMessage);
        } catch (Exception e) {
            logger.error("Error marking transaction {} as failed: {}", 
                transaction.getTxHash(), e.getMessage(), e);
        }
    }

    /**
     * Update the status of a note
     * @param noteId The ID of the note
     * @param status The new status
     */
    private void updateNoteStatus(Long noteId, String status) {
        try {
            Note note = noteRepository.findById(noteId).orElse(null);
            if (note != null) {
                note.setStatus(status);
                
                // Set onChain flag if confirmed
                if ("CONFIRMED".equals(status)) {
                    note.setOnChain(true);
                } else if ("FAILED".equals(status)) {
                    note.setOnChain(false);
                }
                
                noteRepository.save(note);
                logger.debug("Updated note {} status to {}", noteId, status);
            } else {
                logger.warn("Note {} not found for status update", noteId);
            }
        } catch (Exception e) {
            logger.error("Error updating note {} status: {}", noteId, e.getMessage(), e);
        }
    }

    /**
     * Check if sync is enabled
     * @return true if enabled, false otherwise
     */
    public boolean isSyncEnabled() {
        return syncEnabled;
    }

    /**
     * Enable or disable sync
     * @param enabled true to enable, false to disable
     */
    public void setSyncEnabled(boolean enabled) {
        this.syncEnabled = enabled;
        logger.info("Transaction sync {}", enabled ? "enabled" : "disabled");
    }
}
