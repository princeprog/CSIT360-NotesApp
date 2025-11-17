package com.notesapp.nabunturan.DTO;

import com.notesapp.nabunturan.Entity.TransactionStatus;
import com.notesapp.nabunturan.Entity.TransactionType;

import java.time.LocalDateTime;

/**
 * DTO for blockchain transaction data transfer between layers.
 * Used for API responses and service layer data transfer.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for data transfer, not entity operations
 */
public record BlockchainTransactionDto(
        Long id,
        String txHash,
        Long blockHeight,
        LocalDateTime blockTime,
        TransactionType type,
        TransactionStatus status,
        String metadata,
        String walletAddress,
        Long noteId,
        String noteTitle,
        LocalDateTime indexedAt,
        Integer confirmations
) {
    /**
     * Compact canonical constructor for validation
     */
    public BlockchainTransactionDto {
        if (txHash == null || txHash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be null or blank");
        }
        if (blockHeight == null || blockHeight < 0) {
            throw new IllegalArgumentException("Block height cannot be null or negative");
        }
        if (blockTime == null) {
            throw new IllegalArgumentException("Block time cannot be null");
        }
        if (type == null) {
            throw new IllegalArgumentException("Transaction type cannot be null");
        }
        if (status == null) {
            throw new IllegalArgumentException("Transaction status cannot be null");
        }
        if (walletAddress == null || walletAddress.isBlank()) {
            throw new IllegalArgumentException("Wallet address cannot be null or blank");
        }
    }

    /**
     * Check if transaction is confirmed
     */
    public boolean isConfirmed() {
        return status == TransactionStatus.CONFIRMED;
    }

    /**
     * Check if transaction is pending
     */
    public boolean isPending() {
        return status == TransactionStatus.PENDING || status == TransactionStatus.MEMPOOL;
    }

    /**
     * Check if transaction has sufficient confirmations
     * @param requiredConfirmations Minimum required confirmations
     * @return true if confirmations meet or exceed requirement
     */
    public boolean hasConfirmations(int requiredConfirmations) {
        return confirmations != null && confirmations >= requiredConfirmations;
    }

    /**
     * Get transaction age in seconds
     */
    public long getAgeInSeconds() {
        if (blockTime == null) {
            return 0;
        }
        return java.time.Duration.between(blockTime, LocalDateTime.now()).getSeconds();
    }

    /**
     * Check if transaction is associated with a note
     */
    public boolean hasNote() {
        return noteId != null;
    }
}

