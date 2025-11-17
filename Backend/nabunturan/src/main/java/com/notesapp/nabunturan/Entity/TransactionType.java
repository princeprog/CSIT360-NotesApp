package com.notesapp.nabunturan.Entity;

/**
 * Enum representing the type of blockchain transaction
 * related to a note operation
 */
public enum TransactionType {
    /**
     * Transaction that creates a new note on the blockchain
     */
    CREATE,
    
    /**
     * Transaction that updates an existing note on the blockchain
     */
    UPDATE,
    
    /**
     * Transaction that marks a note as deleted on the blockchain
     */
    DELETE
}

