package com.notesapp.nabunturan.DTO;

/**
 * DTO for querying notes by wallet address.
 * Used in REST controllers for wallet-specific queries.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for query operations
 */
public record WalletNotesRequest(
        String walletAddress,
        Boolean onChainOnly,
        String category
) {
    /**
     * Compact canonical constructor for validation
     */
    public WalletNotesRequest {
        if (walletAddress == null || walletAddress.isBlank()) {
            throw new IllegalArgumentException("Wallet address cannot be null or blank");
        }
        if (walletAddress.length() > 150) {
            throw new IllegalArgumentException("Wallet address must not exceed 150 characters");
        }
    }

    /**
     * Check if filtering for on-chain notes only
     */
    public boolean filterOnChainOnly() {
        return onChainOnly != null && onChainOnly;
    }

    /**
     * Check if filtering by category
     */
    public boolean hasCategory() {
        return category != null && !category.isBlank();
    }
}

