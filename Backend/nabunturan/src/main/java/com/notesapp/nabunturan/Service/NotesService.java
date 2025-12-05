package com.notesapp.nabunturan.Service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.notesapp.nabunturan.DTO.CreateNoteWithTxRequest;
import com.notesapp.nabunturan.DTO.DeleteNoteWithTxRequest;
import com.notesapp.nabunturan.DTO.UpdateNoteWithTxRequest;
import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Entity.Transaction;
import com.notesapp.nabunturan.Repository.NoteRepository;

@Service
public class NotesService {

    private final NoteRepository noteRepository;
    private final TransactionService transactionService;

    @Autowired
    public NotesService(NoteRepository noteRepository, TransactionService transactionService) {
        this.noteRepository = noteRepository;
        this.transactionService = transactionService;
    }

    /**
     * Create a new note with transaction tracking
     * @param request CreateNoteWithTxRequest containing note details and transaction info
     * @return Created note with PENDING status
     */
    @Transactional
    public Note createNote(CreateNoteWithTxRequest request) {
        // Validate request
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }
        if (!StringUtils.hasText(request.getTitle())) {
            throw new IllegalArgumentException("Note title cannot be empty");
        }

        // Create note
        Note note = new Note();
        note.setTitle(request.getTitle());
        note.setContent(request.getContent() != null ? request.getContent() : "");
        note.setPinned(request.isPinned());
        note.setCategory(request.getCategory());
        note.setStatus("PENDING");
        note.setTxHash(request.getTxHash());
        note.setWalletAddress(request.getWalletAddress());
        note.setCreatedByWallet(request.getWalletAddress());
        note.setOnChain(false);

        // Save note first to get ID
        Note savedNote = noteRepository.save(note);

        // Create transaction record
        Transaction transaction = transactionService.createTransaction(
            savedNote.getId(),
            request.getTxHash(),
            request.getWalletAddress(),
            request.getMetadataJson()
        );

        return savedNote;
    }

    /**
     * Update an existing note with transaction tracking
     * @param request UpdateNoteWithTxRequest containing updated note details and transaction info
     * @return Updated note with PENDING status
     */
    @Transactional
    public Note updateNote(UpdateNoteWithTxRequest request) {
        if (request == null || request.getNoteId() == null) {
            throw new IllegalArgumentException("Request and note ID cannot be null");
        }

        Note note = noteRepository.findById(request.getNoteId())
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id: " + request.getNoteId()));

        // Update note fields if provided
        if (request.getTitle() != null) {
            note.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            note.setContent(request.getContent());
        }
        if (request.getIsPinned() != null) {
            note.setPinned(request.getIsPinned());
        }
        if (request.getCategory() != null) {
            note.setCategory(request.getCategory());
        }

        // Update transaction tracking
        note.setStatus("PENDING");
        note.setLastUpdatedTxHash(request.getTxHash());
        note.setWalletAddress(request.getWalletAddress());

        Note updatedNote = noteRepository.save(note);

        // Create transaction record for the update
        transactionService.createTransaction(
            updatedNote.getId(),
            request.getTxHash(),
            request.getWalletAddress(),
            request.getMetadataJson()
        );

        return updatedNote;
    }

    /**
     * Delete a note with transaction tracking
     * @param request DeleteNoteWithTxRequest containing note ID and transaction info
     */
    @Transactional
    public void deleteNote(DeleteNoteWithTxRequest request) {
        if (request == null || request.getNoteId() == null) {
            throw new IllegalArgumentException("Request and note ID cannot be null");
        }

        Note note = noteRepository.findById(request.getNoteId())
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id: " + request.getNoteId()));

        // Create DELETE transaction record before deletion
        transactionService.createTransaction(
            note.getId(),
            request.getTxHash(),
            request.getWalletAddress(),
            request.getMetadataJson()
        );

        // Delete the note
        noteRepository.deleteById(request.getNoteId());
    }

    /**
     * Get a note by ID including transaction status
     * @param id Note ID
     * @return Note with transaction details
     */
    public Note getNoteById(Long id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id: " + id));
    }

    /**
     * Get all notes filtered by wallet address
     * @param walletAddress Wallet address to filter by (optional)
     * @return List of notes
     */
    public List<Note> getAllNotes(String walletAddress) {
        if (walletAddress != null && !walletAddress.isEmpty()) {
            return noteRepository.findByWalletAddress(walletAddress);
        }
        return noteRepository.findAll();
    }

    /**
     * Get notes by status and wallet address
     * @param status Transaction status
     * @param walletAddress Wallet address
     * @return List of notes matching criteria
     */
    public List<Note> getNotesByStatus(String status, String walletAddress) {
        if (status == null || status.isEmpty()) {
            throw new IllegalArgumentException("Status cannot be null or empty");
        }
        
        if (walletAddress != null && !walletAddress.isEmpty()) {
            return noteRepository.findByStatusAndWalletAddress(status, walletAddress);
        }
        
        return noteRepository.findByStatus(status);
    }

    // Legacy methods for backward compatibility

    /**
     * Search notes by keyword in title or content
     * @param keyword Search keyword
     * @return List of matching notes
     */
    public List<Note> searchNotes(String keyword) {
        return noteRepository.findByTitleOrContentContainingIgnoreCase(keyword);
    }

    /**
     * Toggle pin status of a note
     * @param id Note ID
     * @return Updated note
     */
    @Transactional
    public Note togglePinStatus(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id: " + id));
        note.setPinned(!note.isPinned());
        return noteRepository.save(note);
    }

    /**
     * Simple create note without transaction tracking (for testing or internal use)
     * @param note Note entity
     * @return Created note
     */
    public Note createNoteSimple(Note note) {
        if (note == null) {
            throw new IllegalArgumentException("Note cannot be null");
        }
        if (!StringUtils.hasText(note.getTitle())) {
            throw new IllegalArgumentException("Note title cannot be empty");
        }
        if (note.getContent() == null) {
            note.setContent("");
        }
        return noteRepository.save(note);
    }

    /**
     * Simple delete note without transaction tracking (for testing or internal use)
     * @param id Note ID
     */
    public void deleteNoteSimple(Long id) {
        if (!noteRepository.existsById(id)) {
            throw new IllegalArgumentException("Note not found with id: " + id);
        }
        noteRepository.deleteById(id);
    }
}