package com.notesapp.nabunturan.Service;

import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Exception.NoteNotFoundException;
import com.notesapp.nabunturan.Repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class NotesService {

    private final NoteRepository noteRepository;

    @Autowired
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
                .orElseThrow(() -> new NoteNotFoundException(id));

        note.setTitle(noteDetails.getTitle());
        note.setContent(noteDetails.getContent());
        note.setPinned(noteDetails.isPinned());
        note.setCategory(noteDetails.getCategory());
        return noteRepository.save(note);
    }

    public Note getNoteById(Long id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new NoteNotFoundException(id));
    }

    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }

    public void deleteNote(Long id) {
        if (!noteRepository.existsById(id)) {
            throw new NoteNotFoundException(id);
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
        if (!StringUtils.hasText(note.getContent())) {
            throw new IllegalArgumentException("Note content cannot be empty");
        }
    }
}