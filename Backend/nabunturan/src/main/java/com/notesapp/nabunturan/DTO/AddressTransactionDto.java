package com.notesapp.nabunturan.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing an address transaction from Blockfrost API
 */
public record AddressTransactionDto(
        @JsonProperty("tx_hash")
        String txHash,
        
        @JsonProperty("tx_index")
        Integer txIndex,
        
        @JsonProperty("block_height")
        Long blockHeight,
        
        @JsonProperty("block_time")
        Long blockTime
) {
    /**
     * Compact constructor for validation
     */
    public AddressTransactionDto {
        if (txHash == null || txHash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be empty");
        }
    }

    /**
     * Get transaction hash
     */
    public String getTxHash() {
        return txHash;
    }

    /**
     * Get block height
     */
    public Long getBlockHeight() {
        return blockHeight;
    }
}

