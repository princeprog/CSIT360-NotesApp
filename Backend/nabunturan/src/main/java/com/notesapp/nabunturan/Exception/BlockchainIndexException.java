package com.notesapp.nabunturan.Exception;

/**
 * Exception thrown when blockchain indexing operations fail.
 * This includes errors during scanning, processing, or storing blockchain data.
 */
public class BlockchainIndexException extends RuntimeException {

    /**
     * Constructor with message
     * 
     * @param message Exception message describing the indexing error
     */
    public BlockchainIndexException(String message) {
        super(message);
    }

    /**
     * Constructor with message and cause
     * 
     * @param message Exception message describing the indexing error
     * @param cause Throwable cause of the exception
     */
    public BlockchainIndexException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Constructor for indexing failure at specific block
     * 
     * @param blockHeight Block height where indexing failed
     * @param cause Root cause of the failure
     * @return BlockchainIndexException with formatted message
     */
    public static BlockchainIndexException atBlock(Long blockHeight, Throwable cause) {
        return new BlockchainIndexException(
            String.format("Failed to index blockchain at block height: %d", blockHeight),
            cause
        );
    }

    /**
     * Constructor for transaction processing failure
     * 
     * @param txHash Transaction hash that failed to process
     * @param cause Root cause of the failure
     * @return BlockchainIndexException with formatted message
     */
    public static BlockchainIndexException forTransaction(String txHash, Throwable cause) {
        return new BlockchainIndexException(
            String.format("Failed to process transaction: %s", txHash),
            cause
        );
    }

    /**
     * Constructor for metadata parsing failure
     * 
     * @param txHash Transaction hash with invalid metadata
     * @return BlockchainIndexException with formatted message
     */
    public static BlockchainIndexException invalidMetadata(String txHash) {
        return new BlockchainIndexException(
            String.format("Invalid or unparseable metadata in transaction: %s", txHash)
        );
    }
}

