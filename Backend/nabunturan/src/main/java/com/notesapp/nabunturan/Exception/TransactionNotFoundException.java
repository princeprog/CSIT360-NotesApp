package com.notesapp.nabunturan.Exception;

/**
 * Exception thrown when a requested blockchain transaction is not found.
 * This typically occurs when querying for transactions that haven't been indexed yet
 * or don't exist in the database.
 */
public class TransactionNotFoundException extends RuntimeException {

    /**
     * Constructor with message
     * 
     * @param message Exception message describing which transaction was not found
     */
    public TransactionNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructor with message and cause
     * 
     * @param message Exception message describing which transaction was not found
     * @param cause Throwable cause of the exception
     */
    public TransactionNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Constructor for transaction not found by hash
     * 
     * @param txHash Transaction hash that was not found
     * @return TransactionNotFoundException with formatted message
     */
    public static TransactionNotFoundException byHash(String txHash) {
        return new TransactionNotFoundException(
            String.format("Blockchain transaction not found with hash: %s", txHash)
        );
    }

    /**
     * Constructor for no transactions found for a note
     * 
     * @param noteId Note ID with no associated transactions
     * @return TransactionNotFoundException with formatted message
     */
    public static TransactionNotFoundException forNote(Long noteId) {
        return new TransactionNotFoundException(
            String.format("No blockchain transactions found for note ID: %d", noteId)
        );
    }

    /**
     * Constructor for no transactions found for a wallet
     * 
     * @param walletAddress Wallet address with no transactions
     * @return TransactionNotFoundException with formatted message
     */
    public static TransactionNotFoundException forWallet(String walletAddress) {
        return new TransactionNotFoundException(
            String.format("No blockchain transactions found for wallet address: %s", walletAddress)
        );
    }

    /**
     * Constructor for pending transactions not found
     * 
     * @return TransactionNotFoundException with formatted message
     */
    public static TransactionNotFoundException noPendingTransactions() {
        return new TransactionNotFoundException("No pending blockchain transactions found");
    }
}

