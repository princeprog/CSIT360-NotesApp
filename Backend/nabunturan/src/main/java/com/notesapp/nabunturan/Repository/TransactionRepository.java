package com.notesapp.nabunturan.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.notesapp.nabunturan.Entity.Transaction;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Find a transaction by its transaction hash
     * @param txHash The transaction hash
     * @return Optional containing the transaction if found
     */
    Optional<Transaction> findByTxHash(String txHash);

    /**
     * Find all transactions associated with a specific note
     * @param noteId The ID of the note
     * @return List of transactions for the note
     */
    List<Transaction> findByNoteId(Long noteId);

    /**
     * Find all transactions with a specific status
     * @param status The transaction status
     * @return List of transactions with the given status
     */
    List<Transaction> findByStatus(String status);

    /**
     * Find all transactions for a specific wallet address
     * @param walletAddress The wallet address
     * @return List of transactions for the wallet
     */
    List<Transaction> findByWalletAddress(String walletAddress);

    /**
     * Find transactions by status that were last checked before a specific time
     * @param status The transaction status
     * @param time The cutoff time for last checked
     * @return List of transactions matching the criteria
     */
    List<Transaction> findByStatusAndLastCheckedAtBefore(String status, LocalDateTime time);

    /**
     * Find all pending transactions using custom query
     * This includes transactions with status 'PENDING', 'SUBMITTED', or 'PROCESSING'
     * @return List of pending transactions ordered by created date
     */
    @Query("SELECT t FROM Transaction t WHERE t.status IN ('PENDING', 'SUBMITTED', 'PROCESSING') ORDER BY t.createdAt ASC")
    List<Transaction> findPendingTransactions();

    /**
     * Find transactions by wallet address with pagination, ordered by creation date descending
     * @param walletAddress The wallet address
     * @param pageable Pagination information
     * @return Page of transactions for the wallet
     */
    Page<Transaction> findByWalletAddressOrderByCreatedAtDesc(String walletAddress, Pageable pageable);
}
