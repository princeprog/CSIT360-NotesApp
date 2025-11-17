package com.notesapp.nabunturan.Controller;

import com.notesapp.nabunturan.DTO.DtoMapper;
import com.notesapp.nabunturan.DTO.NoteDto;
import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Response.ApiResponse;
import com.notesapp.nabunturan.Service.NotesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NotesController {

    private static final Logger logger = LoggerFactory.getLogger(NotesController.class);

    private final NotesService notesService;

    @Autowired
    public NotesController(NotesService notesService) {
        this.notesService = notesService;
    }

    
    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody Note note) {
        try {
            Note createdNote = notesService.createNote(note);
            return new ResponseEntity<>(createdNote, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        }
    }

    
    @GetMapping
    public ResponseEntity<List<Note>> getAllNotes() {
        List<Note> notes = notesService.getAllNotes();
        return new ResponseEntity<>(notes, HttpStatus.OK);
    }

   
    @GetMapping("/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable Long id) {
        try {
            Note note = notesService.getNoteById(id);
            return new ResponseEntity<>(note, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    
    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @RequestBody Note noteDetails) {
        try {
            Note updatedNote = notesService.updateNote(id, noteDetails);
            return new ResponseEntity<>(updatedNote, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(null, HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNote(@PathVariable Long id) {
        try {
            notesService.deleteNote(id);
            return new ResponseEntity<>("Note deleted successfully", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Note not found", HttpStatus.NOT_FOUND);
        }
    }

    //http://localhost:8080/api/notes/search?keyword=first
    @GetMapping("/search")
    public ResponseEntity<List<Note>> searchNotes(@RequestParam String keyword) {
        List<Note> notes = notesService.searchNotes(keyword);
        return new ResponseEntity<>(notes, HttpStatus.OK);
    }

    @PatchMapping("/{id}/toggle-pin")
    public ResponseEntity<Note> togglePinStatus(@PathVariable Long id) {
        try {
            Note updatedNote = notesService.togglePinStatus(id);
            return new ResponseEntity<>(updatedNote, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.NOT_FOUND);
        }
    }

    // ========== WALLET-BASED QUERY ENDPOINTS ==========

    /**
     * Get all notes created by a specific wallet address.
     * GET /api/notes/wallet/{address}
     * 
     * This endpoint fixes the privacy issue where GET /api/notes returns all notes.
     * Now frontend can filter notes by connected wallet address.
     * 
     * @param address Cardano wallet address (bech32 format)
     * @return ApiResponse with list of NoteDto
     */
    @GetMapping("/wallet/{address}")
    public ResponseEntity<ApiResponse<List<NoteDto>>> getNotesByWallet(
            @PathVariable String address) {
        try {
            logger.debug("Fetching notes for wallet address: {}", address);
            
            if (address == null || address.isBlank()) {
                return new ResponseEntity<>(
                        ApiResponse.error("Wallet address cannot be empty."),
                        HttpStatus.BAD_REQUEST
                );
            }
            
            List<Note> notes = notesService.getNotesByWalletAddress(address);
            List<NoteDto> noteDtos = DtoMapper.toNoteDtoList(notes);
            
            logger.info("Retrieved {} notes for wallet address: {}", noteDtos.size(), address);
            
            return new ResponseEntity<>(
                    ApiResponse.success(
                            String.format("Retrieved %d notes for wallet.", noteDtos.size()),
                            noteDtos
                    ),
                    HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            logger.error("Invalid wallet address: {}", e.getMessage());
            return new ResponseEntity<>(
                    ApiResponse.error("Invalid wallet address: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            logger.error("Error fetching notes for wallet {}: {}", address, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to retrieve notes: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get all on-chain notes created by a specific wallet address.
     * GET /api/notes/wallet/{address}/on-chain
     * 
     * Returns only notes that have been synced to the blockchain.
     * 
     * @param address Cardano wallet address (bech32 format)
     * @return ApiResponse with list of NoteDto (only on-chain notes)
     */
    @GetMapping("/wallet/{address}/on-chain")
    public ResponseEntity<ApiResponse<List<NoteDto>>> getOnChainNotesByWallet(
            @PathVariable String address) {
        try {
            logger.debug("Fetching on-chain notes for wallet address: {}", address);
            
            if (address == null || address.isBlank()) {
                return new ResponseEntity<>(
                        ApiResponse.error("Wallet address cannot be empty."),
                        HttpStatus.BAD_REQUEST
                );
            }
            
            List<Note> notes = notesService.getOnChainNotesByWalletAddress(address);
            List<NoteDto> noteDtos = DtoMapper.toNoteDtoList(notes);
            
            logger.info("Retrieved {} on-chain notes for wallet address: {}", noteDtos.size(), address);
            
            return new ResponseEntity<>(
                    ApiResponse.success(
                            String.format("Retrieved %d on-chain notes for wallet.", noteDtos.size()),
                            noteDtos
                    ),
                    HttpStatus.OK
            );
        } catch (IllegalArgumentException e) {
            logger.error("Invalid wallet address: {}", e.getMessage());
            return new ResponseEntity<>(
                    ApiResponse.error("Invalid wallet address: " + e.getMessage()),
                    HttpStatus.BAD_REQUEST
            );
        } catch (Exception e) {
            logger.error("Error fetching on-chain notes for wallet {}: {}", address, e.getMessage(), e);
            return new ResponseEntity<>(
                    ApiResponse.error("Failed to retrieve on-chain notes: " + e.getMessage()),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


}
