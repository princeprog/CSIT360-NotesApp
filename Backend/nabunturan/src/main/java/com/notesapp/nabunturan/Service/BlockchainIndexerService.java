package com.notesapp.nabunturan.Service;

import com.notesapp.nabunturan.DTO.BlockchainTransactionDto;
import com.notesapp.nabunturan.DTO.IndexerStatusDto;

import java.util.List;

/**
 * Service interface for blockchain indexing operations.
 * Provides methods to scan, process, and manage blockchain transactions.
 * 
 * According to backend rules:
 * - Service classes must be interfaces
 * - Implementation in ServiceImpl classes
 * - Returns DTOs, not entities
 */
public interface BlockchainIndexerService {

    /**
     * Start the blockchain indexer.
     * Begins scanning and processing blockchain transactions.
     */
    void startIndexer();

    /**
     * Stop the blockchain indexer.
     * Halts all scanning and processing operations.
     */
    void stopIndexer();

    /**
     * Get current indexer status.
     * 
     * @return IndexerStatusDto containing current indexer state
     */
    IndexerStatusDto getIndexerStatus();

    /**
     * Manually trigger a blockchain scan.
     * Scans for new transactions and processes them.
     * 
     * @return Number of transactions processed
     */
    int scanBlockchain();

    /**
     * Process a specific transaction by hash.
     * 
     * @param txHash Transaction hash to process
     * @return BlockchainTransactionDto if processed successfully, null otherwise
     */
    BlockchainTransactionDto processTransaction(String txHash);

    /**
     * Get all indexed transactions for a specific wallet address.
     * 
     * @param walletAddress Wallet address
     * @return List of blockchain transactions
     */
    List<BlockchainTransactionDto> getTransactionsByWallet(String walletAddress);

    /**
     * Get all pending transactions (not yet confirmed).
     * 
     * @return List of pending transactions
     */
    List<BlockchainTransactionDto> getPendingTransactions();

    /**
     * Update the status of pending transactions.
     * Checks blockchain for confirmation updates.
     * 
     * @return Number of transactions updated
     */
    int updatePendingTransactions();

    /**
     * Reindex transactions from a specific block height.
     * 
     * @param fromBlock Starting block height
     * @return Number of transactions reindexed
     */
    int reindexFromBlock(Long fromBlock);

    /**
     * Get transaction history for a specific note.
     * 
     * @param noteId Note ID
     * @return List of blockchain transactions for the note
     */
    List<BlockchainTransactionDto> getNoteTransactionHistory(Long noteId);
}

