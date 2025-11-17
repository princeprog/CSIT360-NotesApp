package com.notesapp.nabunturan.DTO;

/**
 * DTO for note update requests from API.
 * Used in REST controllers for PUT operations.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for request validation
 */
public record UpdateNoteRequest(
        String title,
        String content,
        String category,
        boolean isPinned
) {
    /**
     * Compact canonical constructor for validation
     */
    public UpdateNoteRequest {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Note title cannot be null or blank");
        }
        if (title.length() > 255) {
            throw new IllegalArgumentException("Note title must not exceed 255 characters");
        }
        if (category != null && category.length() > 100) {
            throw new IllegalArgumentException("Category must not exceed 100 characters");
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
}

