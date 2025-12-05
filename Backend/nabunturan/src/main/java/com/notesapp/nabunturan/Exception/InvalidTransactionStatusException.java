package com.notesapp.nabunturan.Exception;

/**
 * Exception thrown when attempting an invalid transaction status transition
 */
public class InvalidTransactionStatusException extends RuntimeException {

    private Long transactionId;
    private String txHash;
    private String currentStatus;
    private String attemptedStatus;

    public InvalidTransactionStatusException(String message) {
        super(message);
    }

    public InvalidTransactionStatusException(String message, Long transactionId, 
                                            String currentStatus, String attemptedStatus) {
        super(message);
        this.transactionId = transactionId;
        this.currentStatus = currentStatus;
        this.attemptedStatus = attemptedStatus;
    }

    public InvalidTransactionStatusException(String message, String txHash, 
                                            String currentStatus, String attemptedStatus) {
        super(message);
        this.txHash = txHash;
        this.currentStatus = currentStatus;
        this.attemptedStatus = attemptedStatus;
    }

    public static InvalidTransactionStatusException invalidTransition(Long transactionId, 
                                                                     String txHash,
                                                                     String currentStatus, 
                                                                     String attemptedStatus) {
        String message = String.format(
            "Invalid transaction status transition from '%s' to '%s' for transaction: %s",
            currentStatus,
            attemptedStatus,
            txHash != null ? txHash : "ID=" + transactionId
        );
        
        InvalidTransactionStatusException exception = new InvalidTransactionStatusException(message);
        exception.transactionId = transactionId;
        exception.txHash = txHash;
        exception.currentStatus = currentStatus;
        exception.attemptedStatus = attemptedStatus;
        
        return exception;
    }

    public static InvalidTransactionStatusException cannotModifyConfirmed(String txHash) {
        return new InvalidTransactionStatusException(
            "Cannot modify transaction that is already confirmed: " + txHash,
            txHash,
            "CONFIRMED",
            null
        );
    }

    public static InvalidTransactionStatusException invalidStatus(String status) {
        return new InvalidTransactionStatusException(
            "Invalid transaction status: '" + status + "'. Valid statuses are: PENDING, SUBMITTED, PROCESSING, CONFIRMED, FAILED"
        );
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public String getTxHash() {
        return txHash;
    }

    public String getCurrentStatus() {
        return currentStatus;
    }

    public String getAttemptedStatus() {
        return attemptedStatus;
    }
}
