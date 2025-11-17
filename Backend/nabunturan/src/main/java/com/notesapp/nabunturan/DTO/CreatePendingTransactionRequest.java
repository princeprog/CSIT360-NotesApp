package com.notesapp.nabunturan.DTO;

/**
 * Request DTO for creating a pending blockchain transaction.
 * Used when frontend prepares a transaction before submitting to blockchain.
 * 
 * Workflow:
 * 1. YONG builds transaction with Cardano metadata
 * 2. Frontend calls POST /api/blockchain/transactions/pending with this DTO
 * 3. Backend saves transaction with status=PENDING
 * 4. Returns transaction ID for tracking
 * 5. IVAN signs and submits, then updates with txHash
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for request operations
 */
public record CreatePendingTransactionRequest(
        Long noteId,
        String type,           // CREATE, UPDATE, DELETE
        String walletAddress,
        String metadata        // JSON string of note metadata
) {
    /**
     * Compact canonical constructor for validation
     */
    public CreatePendingTransactionRequest {
        if (noteId == null || noteId <= 0) {
            throw new IllegalArgumentException("Note ID must be a positive number");
        }
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("Transaction type cannot be empty");
        }
        // Validate type is one of the allowed values
        if (!type.equals("CREATE") && !type.equals("UPDATE") && !type.equals("DELETE")) {
            throw new IllegalArgumentException(
                "Transaction type must be CREATE, UPDATE, or DELETE");
        }
        if (walletAddress == null || walletAddress.isBlank()) {
            throw new IllegalArgumentException("Wallet address cannot be empty");
        }
        if (walletAddress.length() > 150) {
            throw new IllegalArgumentException("Wallet address must not exceed 150 characters");
        }
        // Metadata can be null for DELETE operations
        if (metadata != null && metadata.length() > 65535) {
            throw new IllegalArgumentException("Metadata is too large");
        }
    }
}

