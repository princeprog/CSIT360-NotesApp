package com.notesapp.nabunturan.DTO;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.notesapp.nabunturan.Entity.Transaction;

/**
 * Response DTO for Transaction history with operation type information
 */
public class TransactionHistoryResponse {

    private Long id;
    private Long noteId;
    private String noteTitle;
    private String txHash;
    private String status;
    private String walletAddress;
    private String operationType; // CREATE, UPDATE, DELETE
    private String metadataJson;
    
    // Blockchain information
    private Long blockHeight;
    private LocalDateTime blockTime;
    private String blockHash;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime lastCheckedAt;
    
    // Status information
    private Integer retryCount;
    private String errorMessage;
    private boolean isConfirmed;
    private boolean isPending;
    private boolean isFailed;
    
    // Additional info
    private Long confirmationTimeMinutes;
    private String statusDescription;

    public TransactionHistoryResponse() {}

    /**
     * Create response from Transaction entity
     * @param transaction Transaction entity
     * @return TransactionHistoryResponse
     */
    public static TransactionHistoryResponse fromEntity(Transaction transaction) {
        TransactionHistoryResponse response = new TransactionHistoryResponse();
        
        response.setId(transaction.getId());
        response.setNoteId(transaction.getNote() != null ? transaction.getNote().getId() : null);
        response.setNoteTitle(transaction.getNote() != null ? transaction.getNote().getTitle() : null);
        response.setTxHash(transaction.getTxHash());
        response.setStatus(transaction.getStatus());
        response.setWalletAddress(transaction.getWalletAddress());
        response.setMetadataJson(transaction.getMetadataJson());
        
        // Blockchain info
        response.setBlockHeight(transaction.getBlockHeight());
        response.setBlockTime(transaction.getBlockTime());
        
        // Timestamps
        response.setCreatedAt(transaction.getCreatedAt());
        response.setConfirmedAt(transaction.getConfirmedAt());
        response.setLastCheckedAt(transaction.getLastCheckedAt());
        
        // Status info
        response.setRetryCount(transaction.getRetryCount());
        response.setErrorMessage(transaction.getErrorMessage());
        
        String status = transaction.getStatus();
        response.setConfirmed("CONFIRMED".equalsIgnoreCase(status));
        response.setPending("PENDING".equalsIgnoreCase(status) || 
                           "SUBMITTED".equalsIgnoreCase(status) || 
                           "PROCESSING".equalsIgnoreCase(status));
        response.setFailed("FAILED".equalsIgnoreCase(status));
        
        // Determine operation type from metadata or other context
        response.setOperationType(determineOperationType(transaction));
        
        // Calculate confirmation time
        if (transaction.getCreatedAt() != null && transaction.getConfirmedAt() != null) {
            long minutes = java.time.Duration.between(
                transaction.getCreatedAt(), 
                transaction.getConfirmedAt()
            ).toMinutes();
            response.setConfirmationTimeMinutes(minutes);
        }
        
        // Set status description
        response.setStatusDescription(getStatusDescription(transaction));
        
        return response;
    }

    /**
     * Create response list from Transaction entities
     * @param transactions List of Transaction entities
     * @return List of TransactionHistoryResponse
     */
    public static List<TransactionHistoryResponse> fromEntities(List<Transaction> transactions) {
        List<TransactionHistoryResponse> responses = new ArrayList<>();
        for (Transaction transaction : transactions) {
            responses.add(fromEntity(transaction));
        }
        return responses;
    }

    /**
     * Determine operation type from transaction metadata
     * @param transaction Transaction entity
     * @return Operation type (CREATE, UPDATE, DELETE)
     */
    private static String determineOperationType(Transaction transaction) {
        // Try to determine from metadata
        String metadata = transaction.getMetadataJson();
        if (metadata != null && !metadata.isEmpty()) {
            // Normalize metadata to uppercase for case-insensitive matching
            String metadataUpper = metadata.toUpperCase();
            
            // Check for various formats of operation field
            // Format 1: "operation":"CREATE" or "operation": "CREATE"
            // Format 2: "type":"CREATE" or "type": "CREATE"
            if (metadataUpper.contains("\"OPERATION\"") || metadataUpper.contains("\"TYPE\"")) {
                if (metadataUpper.contains("\"CREATE\"") || metadataUpper.contains(":\"CREATE\"") || 
                    metadataUpper.contains(": \"CREATE\"")) {
                    return "CREATE";
                } else if (metadataUpper.contains("\"UPDATE\"") || metadataUpper.contains(":\"UPDATE\"") || 
                           metadataUpper.contains(": \"UPDATE\"")) {
                    return "UPDATE";
                } else if (metadataUpper.contains("\"DELETE\"") || metadataUpper.contains(":\"DELETE\"") || 
                           metadataUpper.contains(": \"DELETE\"")) {
                    return "DELETE";
                }
            }
            
            // Try to parse JSON properly using simple string extraction
            try {
                // Look for "operation":"VALUE" pattern
                int opIndex = metadata.toLowerCase().indexOf("\"operation\"");
                if (opIndex != -1) {
                    // Find the value after the colon
                    int colonIndex = metadata.indexOf(":", opIndex);
                    if (colonIndex != -1) {
                        // Find the opening quote of the value
                        int valueStart = metadata.indexOf("\"", colonIndex + 1);
                        if (valueStart != -1) {
                            // Find the closing quote
                            int valueEnd = metadata.indexOf("\"", valueStart + 1);
                            if (valueEnd != -1) {
                                String operationValue = metadata.substring(valueStart + 1, valueEnd).toUpperCase();
                                if ("CREATE".equals(operationValue) || "UPDATE".equals(operationValue) || "DELETE".equals(operationValue)) {
                                    return operationValue;
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                // Ignore parsing errors
            }
        }
        
        // Default to UNKNOWN if can't determine
        return "UNKNOWN";
    }

    /**
     * Get human-readable status description
     * @param transaction Transaction entity
     * @return Status description
     */
    private static String getStatusDescription(Transaction transaction) {
        String status = transaction.getStatus();
        
        if ("CONFIRMED".equalsIgnoreCase(status)) {
            return "Transaction confirmed on blockchain";
        } else if ("PENDING".equalsIgnoreCase(status)) {
            return "Waiting for blockchain confirmation";
        } else if ("SUBMITTED".equalsIgnoreCase(status)) {
            return "Transaction submitted to blockchain";
        } else if ("PROCESSING".equalsIgnoreCase(status)) {
            return "Transaction being processed";
        } else if ("FAILED".equalsIgnoreCase(status)) {
            return transaction.getErrorMessage() != null 
                ? "Failed: " + transaction.getErrorMessage()
                : "Transaction failed";
        }
        
        return "Unknown status";
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

    public String getNoteTitle() {
        return noteTitle;
    }

    public void setNoteTitle(String noteTitle) {
        this.noteTitle = noteTitle;
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

    public String getOperationType() {
        return operationType;
    }

    public void setOperationType(String operationType) {
        this.operationType = operationType;
    }

    public String getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
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

    public String getBlockHash() {
        return blockHash;
    }

    public void setBlockHash(String blockHash) {
        this.blockHash = blockHash;
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

    public Long getConfirmationTimeMinutes() {
        return confirmationTimeMinutes;
    }

    public void setConfirmationTimeMinutes(Long confirmationTimeMinutes) {
        this.confirmationTimeMinutes = confirmationTimeMinutes;
    }

    public String getStatusDescription() {
        return statusDescription;
    }

    public void setStatusDescription(String statusDescription) {
        this.statusDescription = statusDescription;
    }
}
