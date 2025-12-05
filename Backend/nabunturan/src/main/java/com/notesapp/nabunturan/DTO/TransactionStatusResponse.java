package com.notesapp.nabunturan.DTO;

import java.time.LocalDateTime;

import com.notesapp.nabunturan.Entity.Transaction;

/**
 * Response DTO for Transaction status information
 */
public class TransactionStatusResponse {

    private Long id;
    private Long noteId;
    private String txHash;
    private String status;
    private String walletAddress;
    private Long blockHeight;
    private LocalDateTime blockTime;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime lastCheckedAt;
    private Integer retryCount;
    private String errorMessage;
    
    // Additional computed fields
    private boolean isConfirmed;
    private boolean isPending;
    private boolean isFailed;
    private Long waitingTimeMinutes;

    public TransactionStatusResponse() {}

    /**
     * Create response from Transaction entity
     * @param transaction Transaction entity
     * @return TransactionStatusResponse
     */
    public static TransactionStatusResponse fromEntity(Transaction transaction) {
        TransactionStatusResponse response = new TransactionStatusResponse();
        
        response.setId(transaction.getId());
        response.setNoteId(transaction.getNote() != null ? transaction.getNote().getId() : null);
        response.setTxHash(transaction.getTxHash());
        response.setStatus(transaction.getStatus());
        response.setWalletAddress(transaction.getWalletAddress());
        response.setBlockHeight(transaction.getBlockHeight());
        response.setBlockTime(transaction.getBlockTime());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setConfirmedAt(transaction.getConfirmedAt());
        response.setLastCheckedAt(transaction.getLastCheckedAt());
        response.setRetryCount(transaction.getRetryCount());
        response.setErrorMessage(transaction.getErrorMessage());
        
        // Set computed fields
        String status = transaction.getStatus();
        response.setConfirmed("CONFIRMED".equalsIgnoreCase(status));
        response.setPending("PENDING".equalsIgnoreCase(status) || 
                           "SUBMITTED".equalsIgnoreCase(status) || 
                           "PROCESSING".equalsIgnoreCase(status));
        response.setFailed("FAILED".equalsIgnoreCase(status));
        
        // Calculate waiting time
        if (transaction.getCreatedAt() != null && transaction.getConfirmedAt() == null) {
            LocalDateTime now = LocalDateTime.now();
            long minutes = java.time.Duration.between(transaction.getCreatedAt(), now).toMinutes();
            response.setWaitingTimeMinutes(minutes);
        } else if (transaction.getCreatedAt() != null && transaction.getConfirmedAt() != null) {
            long minutes = java.time.Duration.between(transaction.getCreatedAt(), transaction.getConfirmedAt()).toMinutes();
            response.setWaitingTimeMinutes(minutes);
        }
        
        return response;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
    }

    public String getTxHash() {
        return txHash;
    }

    public void setTxHash(String txHash) {
        this.txHash = txHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public Long getBlockHeight() {
        return blockHeight;
    }

    public void setBlockHeight(Long blockHeight) {
        this.blockHeight = blockHeight;
    }

    public LocalDateTime getBlockTime() {
        return blockTime;
    }

    public void setBlockTime(LocalDateTime blockTime) {
        this.blockTime = blockTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public LocalDateTime getLastCheckedAt() {
        return lastCheckedAt;
    }

    public void setLastCheckedAt(LocalDateTime lastCheckedAt) {
        this.lastCheckedAt = lastCheckedAt;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public boolean isConfirmed() {
        return isConfirmed;
    }

    public void setConfirmed(boolean confirmed) {
        isConfirmed = confirmed;
    }

    public boolean isPending() {
        return isPending;
    }

    public void setPending(boolean pending) {
        isPending = pending;
    }

    public boolean isFailed() {
        return isFailed;
    }

    public void setFailed(boolean failed) {
        isFailed = failed;
    }

    public Long getWaitingTimeMinutes() {
        return waitingTimeMinutes;
    }

    public void setWaitingTimeMinutes(Long waitingTimeMinutes) {
        this.waitingTimeMinutes = waitingTimeMinutes;
    }
}
