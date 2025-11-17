package com.notesapp.nabunturan.DTO;

/**
 * DTO for note creation requests from API.
 * Used in REST controllers for POST operations.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for request validation
 */
public record CreateNoteRequest(
        String title,
        String content,
        String category,
        boolean isPinned,
        String createdByWallet
) {
    /**
     * Compact canonical constructor for validation
     */
    public CreateNoteRequest {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Note title cannot be null or blank");
        }
        if (title.length() > 255) {
            throw new IllegalArgumentException("Note title must not exceed 255 characters");
        }
        if (category != null && category.length() > 100) {
            throw new IllegalArgumentException("Category must not exceed 100 characters");
        }
        if (createdByWallet != null && createdByWallet.length() > 150) {
            throw new IllegalArgumentException("Wallet address must not exceed 150 characters");
        }
    }

    /**
     * Check if note has a category
     */
    public boolean hasCategory() {
        return category != null && !category.isBlank();
    }

    /**
     * Check if note has content
     */
    public boolean hasContent() {
        return content != null && !content.isBlank();
    }

    /**
     * Check if note has a wallet
     */
    public boolean hasWallet() {
        return createdByWallet != null && !createdByWallet.isBlank();
    }

    /**
     * Convert to NoteDto for service layer
     */
    public NoteDto toNoteDto() {
        return new NoteDto(
                null, // id will be generated
                title,
                content,
                category,
                isPinned,
                false, // new notes are not on chain initially
                createdByWallet,
                null, // no transaction hash yet
                null, // createdAt will be set by entity
                null  // updatedAt will be set by entity
        );
    }
}

