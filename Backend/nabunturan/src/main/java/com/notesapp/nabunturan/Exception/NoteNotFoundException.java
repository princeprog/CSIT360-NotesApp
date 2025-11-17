package com.notesapp.nabunturan.Exception;

/**
 * Exception thrown when a requested note is not found in the database.
 */
public class NoteNotFoundException extends RuntimeException {

    /**
     * Constructor with message
     * 
     * @param message Exception message
     */
    public NoteNotFoundException(String message) {
        super(message);
    }

    /**
     * Constructor with message and cause
     * 
     * @param message Exception message
     * @param cause Throwable cause
     */
    public NoteNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Constructor for note not found by ID
     * 
     * @param noteId Note ID that was not found
     * @return NoteNotFoundException with formatted message
     */
    public static NoteNotFoundException byId(Long noteId) {
        return new NoteNotFoundException("Note not found with ID: " + noteId);
    }

    /**
     * Constructor for note not found by transaction hash
     * 
     * @param txHash Transaction hash
     * @return NoteNotFoundException with formatted message
     */
    public static NoteNotFoundException byTxHash(String txHash) {
        return new NoteNotFoundException("Note not found with transaction hash: " + txHash);
    }
}
