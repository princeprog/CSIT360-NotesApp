package com.notesapp.nabunturan.Repository;

import com.notesapp.nabunturan.Entity.BlockchainTransaction;
import com.notesapp.nabunturan.Entity.TransactionStatus;
import com.notesapp.nabunturan.Entity.TransactionType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for BlockchainTransaction entity.
 * Provides database operations for blockchain transaction records.
 * 
 * According to backend rules:
 * - Annotated with @Repository
 * - Interface type
 * - Extends JpaRepository
 * - Uses JPQL for @Query methods
 * - Uses @EntityGraph to avoid N+1 problem
 */
@Repository
public interface BlockchainTransactionRepository extends JpaRepository<BlockchainTransaction, Long> {

    /**
     * Find blockchain transaction by transaction hash.
     * Uses @EntityGraph to fetch associated note, preventing N+1 queries.
     * 
     * @param txHash Transaction hash
     * @return Optional containing the transaction if found
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.txHash = :txHash")
    Optional<BlockchainTransaction> findByTxHash(@Param("txHash") String txHash);

    /**
     * Find all blockchain transactions for a specific note.
     * Uses @EntityGraph to fetch associated note.
     * Ordered by block time descending (newest first).
     * 
     * @param noteId Note ID
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.note.id = :noteId ORDER BY bt.blockTime DESC")
    List<BlockchainTransaction> findByNoteId(@Param("noteId") Long noteId);

    /**
     * Find all blockchain transactions for a specific wallet address.
     * Ordered by block time descending (newest first).
     * 
     * @param address Wallet address
     * @return List of blockchain transactions
     */
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.walletAddress = :address ORDER BY bt.blockTime DESC")
    List<BlockchainTransaction> findByWalletAddress(@Param("address") String address);

    /**
     * Find all blockchain transactions with a specific status.
     * Uses @EntityGraph to fetch associated note.
     * Ordered by block time ascending (oldest first).
     * 
     * @param status Transaction status
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.status = :status ORDER BY bt.blockTime ASC")
    List<BlockchainTransaction> findByStatus(@Param("status") TransactionStatus status);

    /**
     * Find all blockchain transactions with a specific type.
     * Uses @EntityGraph to fetch associated note.
     * Ordered by block time descending (newest first).
     * 
     * @param type Transaction type (CREATE, UPDATE, DELETE)
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.type = :type ORDER BY bt.blockTime DESC")
    List<BlockchainTransaction> findByType(@Param("type") TransactionType type);

    /**
     * Count confirmed transactions for a specific note.
     * 
     * @param noteId Note ID
     * @return Number of confirmed transactions
     */
    @Query("SELECT COUNT(bt) FROM BlockchainTransaction bt WHERE bt.note.id = :noteId AND bt.status = 'CONFIRMED'")
    Integer countConfirmedTransactionsByNoteId(@Param("noteId") Long noteId);

    /**
     * Find all transactions after a specific block height.
     * Uses @EntityGraph to fetch associated note.
     * Ordered by block height ascending.
     * 
     * @param fromBlock Starting block height (exclusive)
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.blockHeight > :fromBlock ORDER BY bt.blockHeight ASC")
    List<BlockchainTransaction> findTransactionsAfterBlock(@Param("fromBlock") Long fromBlock);

    /**
     * Find all transactions within a block height range.
     * Uses @EntityGraph to fetch associated note.
     * 
     * @param startBlock Starting block height (inclusive)
     * @param endBlock Ending block height (inclusive)
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.blockHeight >= :startBlock AND bt.blockHeight <= :endBlock ORDER BY bt.blockHeight ASC")
    List<BlockchainTransaction> findTransactionsBetweenBlocks(@Param("startBlock") Long startBlock, @Param("endBlock") Long endBlock);

    /**
     * Find all transactions within a time range.
     * Uses @EntityGraph to fetch associated note.
     * 
     * @param startTime Starting time (inclusive)
     * @param endTime Ending time (inclusive)
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.blockTime >= :startTime AND bt.blockTime <= :endTime ORDER BY bt.blockTime DESC")
    List<BlockchainTransaction> findTransactionsBetweenTimes(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Find all pending transactions (not yet confirmed).
     * Uses @EntityGraph to fetch associated note.
     * Ordered by indexed time ascending (oldest first).
     * 
     * @return List of pending blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.status IN ('PENDING', 'MEMPOOL') ORDER BY bt.indexedAt ASC")
    List<BlockchainTransaction> findPendingTransactions();

    /**
     * Find all confirmed transactions for a specific wallet address.
     * 
     * @param address Wallet address
     * @return List of confirmed blockchain transactions
     */
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.walletAddress = :address AND bt.status = 'CONFIRMED' ORDER BY bt.blockTime DESC")
    List<BlockchainTransaction> findConfirmedTransactionsByWallet(@Param("address") String address);

    /**
     * Find the latest transaction for a specific note.
     * Uses @EntityGraph to fetch associated note.
     * 
     * @param noteId Note ID
     * @return Optional containing the latest transaction if found
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.note.id = :noteId ORDER BY bt.blockTime DESC")
    Optional<BlockchainTransaction> findLatestTransactionByNoteId(@Param("noteId") Long noteId);

    /**
     * Find transactions by wallet address and transaction type.
     * Uses @EntityGraph to fetch associated note.
     * 
     * @param address Wallet address
     * @param type Transaction type
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.walletAddress = :address AND bt.type = :type ORDER BY bt.blockTime DESC")
    List<BlockchainTransaction> findByWalletAddressAndType(@Param("address") String address, @Param("type") TransactionType type);

    /**
     * Count total transactions by status.
     * 
     * @param status Transaction status
     * @return Number of transactions
     */
    @Query("SELECT COUNT(bt) FROM BlockchainTransaction bt WHERE bt.status = :status")
    Long countByStatus(@Param("status") TransactionStatus status);

    /**
     * Count total transactions by type.
     * 
     * @param type Transaction type
     * @return Number of transactions
     */
    @Query("SELECT COUNT(bt) FROM BlockchainTransaction bt WHERE bt.type = :type")
    Long countByType(@Param("type") TransactionType type);

    /**
     * Find all transactions with confirmations less than a specified number.
     * Uses @EntityGraph to fetch associated note.
     * Useful for monitoring transaction finality.
     * 
     * @param maxConfirmations Maximum number of confirmations
     * @return List of blockchain transactions
     */
    @EntityGraph(attributePaths = {"note"})
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.confirmations < :maxConfirmations AND bt.status = 'CONFIRMED' ORDER BY bt.blockTime DESC")
    List<BlockchainTransaction> findTransactionsWithLowConfirmations(@Param("maxConfirmations") Integer maxConfirmations);

    /**
     * Check if a transaction hash already exists in the database.
     * Useful for preventing duplicate indexing.
     * 
     * @param txHash Transaction hash
     * @return true if transaction exists, false otherwise
     */
    @Query("SELECT COUNT(bt) > 0 FROM BlockchainTransaction bt WHERE bt.txHash = :txHash")
    boolean existsByTxHash(@Param("txHash") String txHash);

    /**
     * Find all transactions indexed within a specific time range.
     * Useful for monitoring indexer performance.
     * 
     * @param startTime Starting indexed time
     * @param endTime Ending indexed time
     * @return List of blockchain transactions
     */
    @Query("SELECT bt FROM BlockchainTransaction bt WHERE bt.indexedAt >= :startTime AND bt.indexedAt <= :endTime ORDER BY bt.indexedAt DESC")
    List<BlockchainTransaction> findByIndexedAtBetween(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);
}

