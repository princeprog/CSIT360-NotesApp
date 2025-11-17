package com.notesapp.nabunturan.Entity;

/**
 * Enum representing the status of a blockchain transaction
 */
public enum TransactionStatus {
    /**
     * Transaction is waiting to be included in a block
     */
    PENDING,
    
    /**
     * Transaction is in the mempool but not yet confirmed
     */
    MEMPOOL,
    
    /**
     * Transaction has been confirmed on the blockchain
     */
    CONFIRMED,
    
    /**
     * Transaction has failed or was rejected
     */
    FAILED
}

