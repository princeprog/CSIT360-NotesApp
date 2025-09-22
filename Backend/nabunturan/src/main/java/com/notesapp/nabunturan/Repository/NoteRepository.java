package com.notesapp.nabunturan.Repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
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
}
