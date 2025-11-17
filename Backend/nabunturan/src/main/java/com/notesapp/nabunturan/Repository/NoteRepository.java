package com.notesapp.nabunturan.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.notesapp.nabunturan.Entity.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    
    
    List<Note> findByTitleContainingIgnoreCase(String title);
    
   
    List<Note> findByContentContainingIgnoreCase(String content);
    
    
    @Query("SELECT n FROM Note n WHERE LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Note> findByTitleOrContentContainingIgnoreCase(@Param("keyword") String keyword);
    
   
    List<Note> findByCreatedAtAfter(LocalDateTime date);
    

    List<Note> findByUpdatedAtAfter(LocalDateTime date);
    
   
    List<Note> findAllByOrderByCreatedAtDesc();
    

    List<Note> findAllByOrderByUpdatedAtDesc();
    
  
    @Query("SELECT COUNT(n) FROM Note n")
    long countAllNotes();
    
   
    void deleteByTitle(String title);


    @Modifying
    @Query("UPDATE Note n SET n.isPinned = NOT n.isPinned WHERE n.id = :id")
    void togglePinStatus(@Param("id") Long id);

    // ========== BLOCKCHAIN-RELATED QUERIES (Phase 3) ==========

    /**
     * Find all notes that are on the blockchain.
     * Uses @EntityGraph to eagerly fetch blockchain transactions, avoiding N+1 problem.
     * Ordered by updated time descending (newest first).
     * 
     * @return List of on-chain notes
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.onChain = true ORDER BY n.updatedAt DESC")
    List<Note> findAllOnChainNotes();

    /**
     * Find all notes that are NOT on the blockchain.
     * Ordered by updated time descending (newest first).
     * 
     * @return List of off-chain notes
     */
    @Query("SELECT n FROM Note n WHERE n.onChain = false ORDER BY n.updatedAt DESC")
    List<Note> findAllOffChainNotes();

    /**
     * Find notes created by a specific wallet address.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * Ordered by created time descending (newest first).
     * 
     * @param wallet Wallet address
     * @return List of notes created by the wallet
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.createdByWallet = :wallet ORDER BY n.createdAt DESC")
    List<Note> findByWalletAddress(@Param("wallet") String wallet);

    /**
     * Find a note by its latest transaction hash.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * 
     * @param txHash Transaction hash
     * @return Optional containing the note if found
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.latestTxHash = :txHash")
    Optional<Note> findByLatestTxHash(@Param("txHash") String txHash);

    /**
     * Count notes that are on the blockchain.
     * 
     * @return Number of on-chain notes
     */
    @Query("SELECT COUNT(n) FROM Note n WHERE n.onChain = true")
    Long countOnChainNotes();

    /**
     * Count notes that are NOT on the blockchain.
     * 
     * @return Number of off-chain notes
     */
    @Query("SELECT COUNT(n) FROM Note n WHERE n.onChain = false")
    Long countOffChainNotes();

    /**
     * Find notes by wallet address and on-chain status.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * 
     * @param wallet Wallet address
     * @param onChain On-chain status
     * @return List of notes
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.createdByWallet = :wallet AND n.onChain = :onChain ORDER BY n.updatedAt DESC")
    List<Note> findByWalletAddressAndOnChainStatus(@Param("wallet") String wallet, @Param("onChain") Boolean onChain);

    /**
     * Find notes with blockchain transactions.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * Useful for finding notes that have been indexed from blockchain.
     * 
     * @return List of notes with blockchain transactions
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT DISTINCT n FROM Note n JOIN n.blockchainTransactions bt ORDER BY n.updatedAt DESC")
    List<Note> findNotesWithBlockchainTransactions();

    /**
     * Find notes by wallet address with transaction count.
     * Returns notes that have at least one blockchain transaction.
     * 
     * @param wallet Wallet address
     * @return List of notes
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT DISTINCT n FROM Note n JOIN n.blockchainTransactions bt WHERE n.createdByWallet = :wallet ORDER BY n.updatedAt DESC")
    List<Note> findByWalletAddressWithTransactions(@Param("wallet") String wallet);

    /**
     * Find on-chain notes created within a time range.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * 
     * @param startTime Starting time (inclusive)
     * @param endTime Ending time (inclusive)
     * @return List of on-chain notes
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.onChain = true AND n.createdAt >= :startTime AND n.createdAt <= :endTime ORDER BY n.createdAt DESC")
    List<Note> findOnChainNotesBetweenTimes(@Param("startTime") LocalDateTime startTime, @Param("endTime") LocalDateTime endTime);

    /**
     * Find notes by category and on-chain status.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * 
     * @param category Note category
     * @param onChain On-chain status
     * @return List of notes
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.category = :category AND n.onChain = :onChain ORDER BY n.updatedAt DESC")
    List<Note> findByCategoryAndOnChainStatus(@Param("category") String category, @Param("onChain") Boolean onChain);

    /**
     * Search notes on blockchain by keyword.
     * Searches in title and content for on-chain notes only.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * 
     * @param keyword Search keyword
     * @return List of matching on-chain notes
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.onChain = true AND (LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY n.updatedAt DESC")
    List<Note> searchOnChainNotes(@Param("keyword") String keyword);

    /**
     * Count notes by wallet address.
     * 
     * @param wallet Wallet address
     * @return Number of notes created by the wallet
     */
    @Query("SELECT COUNT(n) FROM Note n WHERE n.createdByWallet = :wallet")
    Long countByWalletAddress(@Param("wallet") String wallet);

    /**
     * Find note with full blockchain transaction details by ID.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * This method is optimized for viewing a single note with all its blockchain history.
     * 
     * @param id Note ID
     * @return Optional containing the note with transactions if found
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.id = :id")
    Optional<Note> findByIdWithTransactions(@Param("id") Long id);

    /**
     * Find recently updated on-chain notes.
     * Uses @EntityGraph to eagerly fetch blockchain transactions.
     * 
     * @param since Time threshold (e.g., last 24 hours)
     * @return List of recently updated on-chain notes
     */
    @EntityGraph(attributePaths = {"blockchainTransactions"})
    @Query("SELECT n FROM Note n WHERE n.onChain = true AND n.updatedAt >= :since ORDER BY n.updatedAt DESC")
    List<Note> findRecentlyUpdatedOnChainNotes(@Param("since") LocalDateTime since);

    /**
     * Check if a note with a specific transaction hash exists.
     * Useful for preventing duplicate note creation from blockchain indexing.
     * 
     * @param txHash Transaction hash
     * @return true if note exists, false otherwise
     */
    @Query("SELECT COUNT(n) > 0 FROM Note n WHERE n.latestTxHash = :txHash")
    boolean existsByLatestTxHash(@Param("txHash") String txHash);
}

