package com.notesapp.nabunturan.DTO;

/**
 * DTO for syncing a note to the blockchain.
 * Used in REST controllers for blockchain sync operations.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for blockchain operations
 */
public record SyncNoteToBlockchainRequest(
        Long noteId,
        String walletAddress,
        String txHash
) {
    /**
     * Compact canonical constructor for validation
     */
    public SyncNoteToBlockchainRequest {
        if (noteId == null) {
            throw new IllegalArgumentException("Note ID cannot be null");
        }
        if (walletAddress == null || walletAddress.isBlank()) {
            throw new IllegalArgumentException("Wallet address cannot be null or blank");
        }
        if (walletAddress.length() > 150) {
            throw new IllegalArgumentException("Wallet address must not exceed 150 characters");
        }
        if (txHash == null || txHash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be null or blank");
        }
        if (txHash.length() > 64) {
            throw new IllegalArgumentException("Transaction hash must not exceed 64 characters");
        }
    }
}

