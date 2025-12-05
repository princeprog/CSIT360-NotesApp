package com.notesapp.nabunturan.Exception;

/**
 * Exception thrown when a transaction is not found in the database
 */
public class TransactionNotFoundException extends RuntimeException {

    private Long transactionId;
    private String txHash;

    public TransactionNotFoundException(String message) {
        super(message);
    }

    public TransactionNotFoundException(Long transactionId) {
        super("Transaction not found with id: " + transactionId);
        this.transactionId = transactionId;
    }

    public TransactionNotFoundException(String message, Long transactionId) {
        super(message);
        this.transactionId = transactionId;
    }

    public TransactionNotFoundException(String message, String txHash) {
        super(message);
        this.txHash = txHash;
    }

    public static TransactionNotFoundException byId(Long id) {
        return new TransactionNotFoundException("Transaction not found with id: " + id, id);
    }

    public static TransactionNotFoundException byTxHash(String txHash) {
        return new TransactionNotFoundException("Transaction not found with hash: " + txHash, txHash);
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public String getTxHash() {
        return txHash;
    }
}
