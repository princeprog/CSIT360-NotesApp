package com.notesapp.nabunturan.Exception;

import java.time.LocalDateTime;

/**
 * Exception thrown when a transaction has exceeded its timeout period
 */
public class TransactionExpiredException extends RuntimeException {

    private Long transactionId;
    private String txHash;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
    private long waitingMinutes;

    public TransactionExpiredException(String message) {
        super(message);
    }

    public TransactionExpiredException(String message, Long transactionId, String txHash) {
        super(message);
        this.transactionId = transactionId;
        this.txHash = txHash;
    }

    public TransactionExpiredException(String message, Long transactionId, String txHash, 
                                      LocalDateTime createdAt, LocalDateTime expiredAt) {
        super(message);
        this.transactionId = transactionId;
        this.txHash = txHash;
        this.createdAt = createdAt;
        this.expiredAt = expiredAt;
        
        if (createdAt != null && expiredAt != null) {
            this.waitingMinutes = java.time.Duration.between(createdAt, expiredAt).toMinutes();
        }
    }

    public static TransactionExpiredException create(Long transactionId, String txHash, 
                                                    LocalDateTime createdAt, long timeoutMinutes) {
        LocalDateTime expiredAt = LocalDateTime.now();
        long waitingMinutes = java.time.Duration.between(createdAt, expiredAt).toMinutes();
        
        String message = String.format(
            "Transaction expired after waiting %d minutes (timeout: %d minutes). Transaction: %s",
            waitingMinutes,
            timeoutMinutes,
            txHash
        );
        
        return new TransactionExpiredException(message, transactionId, txHash, createdAt, expiredAt);
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public String getTxHash() {
        return txHash;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getExpiredAt() {
        return expiredAt;
    }

    public long getWaitingMinutes() {
        return waitingMinutes;
    }
}
