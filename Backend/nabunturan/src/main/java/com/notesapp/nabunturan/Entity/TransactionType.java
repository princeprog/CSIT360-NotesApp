package com.notesapp.nabunturan.Entity;

/**
 * Enum representing the type of blockchain transaction operation
 */
public enum TransactionType {
    /**
     * Transaction creates a new note on the blockchain
     */
    CREATE,
    
    /**
     * Transaction updates an existing note on the blockchain
     */
    UPDATE,
    
    /**
     * Transaction deletes a note from the blockchain
     */
    DELETE
}

