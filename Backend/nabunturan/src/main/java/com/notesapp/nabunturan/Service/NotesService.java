package com.notesapp.nabunturan.Service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Repository.NoteRepository;

@Service
public class NotesService {

    private final NoteRepository noteRepository;

    public NotesService(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    public Note createNote(Note note) {
        validateNote(note);
        return noteRepository.save(note);
    }

    public Note updateNote(Long id, Note noteDetails) {
        validateNote(noteDetails);
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Id not found"));

        note.setTitle(noteDetails.getTitle());
        note.setContent(noteDetails.getContent());
        note.setPinned(noteDetails.isPinned());
        note.setCategory(noteDetails.getCategory());
        return noteRepository.save(note);
    }

    public Note getNoteById(Long id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id: " + id));
    }

    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }

    public void deleteNote(Long id) {
        if (!noteRepository.existsById(id)) {
            throw new IllegalArgumentException("Note not found with id: " + id);
        }
        noteRepository.deleteById(id);
    }

    public List<Note> searchNotes(String keyword) {
        return noteRepository.findByTitleOrContentContainingIgnoreCase(keyword);
    }

    
    private void validateNote(Note note) {
        if (note == null) {
            throw new IllegalArgumentException("Note cannot be null");
        }
        if (!StringUtils.hasText(note.getTitle())) {
            throw new IllegalArgumentException("Note title cannot be empty");
        }
        // Content can be empty, so we don't validate it
        if (note.getContent() == null) {
            note.setContent(""); // Set empty string instead of null
        }
    }

    @Transactional
    public Note togglePinStatus(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Note not found with id: " + id));
        note.setPinned(!note.isPinned());
        return noteRepository.save(note);
    }
}