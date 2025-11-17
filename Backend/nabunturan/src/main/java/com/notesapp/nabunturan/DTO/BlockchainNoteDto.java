package com.notesapp.nabunturan.DTO;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO combining note data with blockchain transaction information.
 * Used for detailed note views with full blockchain history.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Combines data from multiple sources
 */
public record BlockchainNoteDto(
        Long id,
        String title,
        String content,
        String category,
        boolean isPinned,
        boolean onChain,
        String createdByWallet,
        String latestTxHash,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<BlockchainTransactionDto> transactions
) {
    /**
     * Compact canonical constructor for validation
     */
    public BlockchainNoteDto {
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
        // Ensure transactions list is never null
        if (transactions == null) {
            transactions = List.of();
        }
    }

    /**
     * Get transaction count
     */
    public int getTransactionCount() {
        return transactions != null ? transactions.size() : 0;
    }

    /**
     * Get confirmed transaction count
     */
    public long getConfirmedTransactionCount() {
        if (transactions == null) {
            return 0;
        }
        return transactions.stream()
                .filter(BlockchainTransactionDto::isConfirmed)
                .count();
    }

    /**
     * Get pending transaction count
     */
    public long getPendingTransactionCount() {
        if (transactions == null) {
            return 0;
        }
        return transactions.stream()
                .filter(BlockchainTransactionDto::isPending)
                .count();
    }

    /**
     * Get latest transaction
     */
    public BlockchainTransactionDto getLatestTransaction() {
        if (transactions == null || transactions.isEmpty()) {
            return null;
        }
        return transactions.stream()
                .max((t1, t2) -> t1.blockTime().compareTo(t2.blockTime()))
                .orElse(null);
    }

    /**
     * Get oldest transaction
     */
    public BlockchainTransactionDto getOldestTransaction() {
        if (transactions == null || transactions.isEmpty()) {
            return null;
        }
        return transactions.stream()
                .min((t1, t2) -> t1.blockTime().compareTo(t2.blockTime()))
                .orElse(null);
    }

    /**
     * Check if note has blockchain transactions
     */
    public boolean hasTransactions() {
        return transactions != null && !transactions.isEmpty();
    }

    /**
     * Check if note has confirmed transactions
     */
    public boolean hasConfirmedTransactions() {
        return getConfirmedTransactionCount() > 0;
    }

    /**
     * Check if note has pending transactions
     */
    public boolean hasPendingTransactions() {
        return getPendingTransactionCount() > 0;
    }

    /**
     * Check if note is on blockchain
     */
    public boolean isOnChain() {
        return onChain;
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
}

