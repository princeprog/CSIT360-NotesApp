package com.notesapp.nabunturan.Controller;

import com.notesapp.nabunturan.DTO.CreateNoteWithTxRequest;
import com.notesapp.nabunturan.DTO.DeleteNoteWithTxRequest;
import com.notesapp.nabunturan.DTO.NoteWithStatusResponse;
import com.notesapp.nabunturan.DTO.UpdateNoteWithTxRequest;
import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Service.NotesService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
@Validated
public class NotesController {

    private final NotesService notesService;

    public NotesController(NotesService notesService) {
        this.notesService = notesService;
    }

    /**
     * POST /api/notes - Create a new note with transaction tracking
     * @param request CreateNoteWithTxRequest
     * @return NoteWithStatusResponse (201 Created)
     */
    @PostMapping
    public ResponseEntity<NoteWithStatusResponse> createNote(@Valid @RequestBody CreateNoteWithTxRequest request) {
        Note createdNote = notesService.createNote(request);
        NoteWithStatusResponse response = NoteWithStatusResponse.fromEntity(createdNote);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * PUT /api/notes/{id} - Update an existing note with transaction tracking
     * @param id Note ID
     * @param request UpdateNoteWithTxRequest
     * @return NoteWithStatusResponse (200 OK)
     */
    @PutMapping("/{id}")
    public ResponseEntity<NoteWithStatusResponse> updateNote(
            @PathVariable Long id, 
            @Valid @RequestBody UpdateNoteWithTxRequest request) {
        // Set the note ID from path variable
        request.setNoteId(id);
        Note updatedNote = notesService.updateNote(request);
        NoteWithStatusResponse response = NoteWithStatusResponse.fromEntity(updatedNote);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * DELETE /api/notes/{id} - Delete a note with transaction tracking
     * @param id Note ID
     * @param request DeleteNoteWithTxRequest
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            @Valid @RequestBody DeleteNoteWithTxRequest request) {
        // Set the note ID from path variable
        request.setNoteId(id);
        notesService.deleteNote(request);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    /**
     * GET /api/notes - Get all notes with optional filters
     * @param walletAddress Optional wallet address filter
     * @param status Optional status filter
     * @return List<NoteWithStatusResponse>
     */
    @GetMapping
    public ResponseEntity<List<NoteWithStatusResponse>> getAllNotes(
            @RequestParam(required = false) String walletAddress,
            @RequestParam(required = false) 
            @Pattern(regexp = "^(PENDING|SUBMITTED|PROCESSING|CONFIRMED|FAILED)$", 
                     message = "Status must be one of: PENDING, SUBMITTED, PROCESSING, CONFIRMED, FAILED") 
            String status) {
        List<Note> notes;
        
        if (status != null && !status.isEmpty()) {
            notes = notesService.getNotesByStatus(status, walletAddress);
        } else {
            notes = notesService.getAllNotes(walletAddress);
        }
        
        List<NoteWithStatusResponse> responses = NoteWithStatusResponse.fromEntities(notes);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    /**
     * GET /api/notes/{id} - Get a single note by ID
     * @param id Note ID
     * @return NoteWithStatusResponse
     */
    @GetMapping("/{id}")
    public ResponseEntity<NoteWithStatusResponse> getNoteById(@PathVariable Long id) {
        Note note = notesService.getNoteById(id);
        NoteWithStatusResponse response = NoteWithStatusResponse.fromEntity(note);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * GET /api/notes/pending - Get all pending notes
     * @param walletAddress Optional wallet address filter
     * @return List<NoteWithStatusResponse>
     */
    @GetMapping("/pending")
    public ResponseEntity<List<NoteWithStatusResponse>> getPendingNotes(
            @RequestParam(required = false) String walletAddress) {
        List<Note> notes = notesService.getNotesByStatus("PENDING", walletAddress);
        List<NoteWithStatusResponse> responses = NoteWithStatusResponse.fromEntities(notes);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    // Additional endpoints for backward compatibility and extra features
    
    /**
     * GET /api/notes/search - Search notes by keyword
     * @param keyword Search keyword
     * @return List<NoteWithStatusResponse>
     */
    @GetMapping("/search")
    public ResponseEntity<List<NoteWithStatusResponse>> searchNotes(
            @RequestParam @NotBlank(message = "Search keyword is required") String keyword) {
        List<Note> notes = notesService.searchNotes(keyword);
        List<NoteWithStatusResponse> responses = NoteWithStatusResponse.fromEntities(notes);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    /**
     * PATCH /api/notes/{id}/toggle-pin - Toggle pin status of a note
     * @param id Note ID
     * @return NoteWithStatusResponse
     */
    @PatchMapping("/{id}/toggle-pin")
    public ResponseEntity<NoteWithStatusResponse> togglePinStatus(@PathVariable Long id) {
        Note updatedNote = notesService.togglePinStatus(id);
        NoteWithStatusResponse response = NoteWithStatusResponse.fromEntity(updatedNote);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
