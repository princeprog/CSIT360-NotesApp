package com.notesapp.nabunturan.DTO;

import java.time.LocalDateTime;

/**
 * DTO for note metadata without full content.
 * Optimized for list views and summaries.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for lightweight data transfer
 */
public record NoteMetadataDto(
        Long id,
        String title,
        String category,
        boolean isPinned,
        boolean onChain,
        String createdByWallet,
        String latestTxHash,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Integer transactionCount,
        Integer confirmedTransactionCount
) {
    /**
     * Compact canonical constructor for validation
     */
    public NoteMetadataDto {
        if (id == null) {
            throw new IllegalArgumentException("Note ID cannot be null");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Note title cannot be null or blank");
        }
        if (createdAt == null) {
            throw new IllegalArgumentException("Created date cannot be null");
        }
        if (updatedAt == null) {
            throw new IllegalArgumentException("Updated date cannot be null");
        }
    }

    /**
     * Check if note is on blockchain
     */
    public boolean isOnChain() {
        return onChain;
    }

    /**
     * Check if note has blockchain transactions
     */
    public boolean hasTransactions() {
        return transactionCount != null && transactionCount > 0;
    }

    /**
     * Check if note has confirmed transactions
     */
    public boolean hasConfirmedTransactions() {
        return confirmedTransactionCount != null && confirmedTransactionCount > 0;
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
     * Get note age in days
     */
    public long getAgeInDays() {
        if (createdAt == null) {
            return 0;
        }
        return java.time.Duration.between(createdAt, LocalDateTime.now()).toDays();
    }

    /**
     * Get days since last update
     */
    public long getDaysSinceUpdate() {
        if (updatedAt == null) {
            return 0;
        }
        return java.time.Duration.between(updatedAt, LocalDateTime.now()).toDays();
    }
}

