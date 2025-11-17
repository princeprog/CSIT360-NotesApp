package com.notesapp.nabunturan.DTO;

import java.time.LocalDateTime;

/**
 * DTO for standard note data transfer.
 * Used for CRUD operations and general note display.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for standard note operations
 */
public record NoteDto(
        Long id,
        String title,
        String content,
        String category,
        boolean isPinned,
        boolean onChain,
        String createdByWallet,
        String latestTxHash,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    /**
     * Compact canonical constructor for validation
     */
    public NoteDto {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Note title cannot be null or blank");
        }
        // Allow null for id (for create operations)
        // Allow null for createdAt and updatedAt (will be set by entity)
    }

    /**
     * Check if note is on blockchain
     */
    public boolean isOnChain() {
        return onChain;
    }

    /**
     * Check if note has an ID (persisted)
     */
    public boolean isPersisted() {
        return id != null;
    }

    /**
     * Check if note is associated with a wallet
     */
    public boolean hasWallet() {
        return createdByWallet != null && !createdByWallet.isBlank();
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
     * Check if note has a transaction hash
     */
    public boolean hasTransactionHash() {
        return latestTxHash != null && !latestTxHash.isBlank();
    }

    /**
     * Get content length
     */
    public int getContentLength() {
        return content != null ? content.length() : 0;
    }

    /**
     * Get note age in days (if persisted)
     */
    public long getAgeInDays() {
        if (createdAt == null) {
            return 0;
        }
        return java.time.Duration.between(createdAt, LocalDateTime.now()).toDays();
    }
}

