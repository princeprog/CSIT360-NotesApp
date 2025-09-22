package com.notesapp.nabunturan.Controller;

import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Service.NotesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*")
public class NotesController {

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


}
