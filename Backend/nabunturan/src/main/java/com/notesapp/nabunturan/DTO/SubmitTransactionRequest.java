package com.notesapp.nabunturan.DTO;

/**
 * Request DTO for submitting a blockchain transaction hash.
 * Used when IVAN signs and submits transaction to blockchain.
 * 
 * Workflow:
 * 1. IVAN signs pending transaction with Lace wallet
 * 2. IVAN submits signed transaction to Cardano network
 * 3. Cardano returns transaction hash (txHash)
 * 4. IVAN calls PUT /api/blockchain/transactions/{id}/submit with this DTO
 * 5. Backend updates transaction status to MEMPOOL and stores txHash
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for request operations
 */
public record SubmitTransactionRequest(
        String txHash  // Cardano transaction hash (64 hex characters)
) {
    /**
     * Compact canonical constructor for validation
     */
    public SubmitTransactionRequest {
        if (txHash == null || txHash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be empty");
        }
        if (txHash.length() != 64) {
            throw new IllegalArgumentException(
                "Invalid transaction hash format. Must be 64 hex characters. Got: " + txHash.length());
        }
        // Validate it's hex
        if (!txHash.matches("^[0-9a-fA-F]{64}$")) {
            throw new IllegalArgumentException(
                "Transaction hash must contain only hexadecimal characters (0-9, a-f, A-F)");
        }
    }
}

