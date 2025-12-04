package com.notesapp.nabunturan.Repository;

import java.time.LocalDateTime;
import java.util.List;
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

    /**
     * Find all notes by status
     * @param status The note status
     * @return List of notes with the given status
     */
    List<Note> findByStatus(String status);

    /**
     * Find all notes by wallet address
     * @param walletAddress The wallet address
     * @return List of notes for the wallet
     */
    List<Note> findByWalletAddress(String walletAddress);

    /**
     * Find notes by status and wallet address
     * @param status The note status
     * @param walletAddress The wallet address
     * @return List of notes matching both criteria
     */
    List<Note> findByStatusAndWalletAddress(String status, String walletAddress);

}

