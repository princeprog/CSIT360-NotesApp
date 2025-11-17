package com.notesapp.nabunturan.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

/**
 * DTO representing a Cardano transaction from Blockfrost API
 */
public record TransactionDto(
        @JsonProperty("hash")
        String hash,
        
        @JsonProperty("block")
        String block,
        
        @JsonProperty("block_height")
        Long blockHeight,
        
        @JsonProperty("block_time")
        Long blockTime,
        
        @JsonProperty("slot")
        Long slot,
        
        @JsonProperty("index")
        Integer index,
        
        @JsonProperty("fees")
        String fees,
        
        @JsonProperty("deposit")
        String deposit,
        
        @JsonProperty("size")
        Integer size,
        
        @JsonProperty("invalid_before")
        String invalidBefore,
        
        @JsonProperty("invalid_hereafter")
        String invalidHereafter,
        
        @JsonProperty("valid_contract")
        Boolean validContract
) {
    /**
     * Compact constructor for validation
     */
    public TransactionDto {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be empty");
        }
    }

    /**
     * Get transaction hash
     */
    public String getHash() {
        return hash;
    }

    /**
     * Get block height
     */
    public Long getBlockHeight() {
        return blockHeight;
    }

    /**
     * Get block time as LocalDateTime
     */
    public LocalDateTime getBlockTime() {
        if (blockTime == null) {
            return null;
        }
        return LocalDateTime.ofEpochSecond(blockTime, 0, java.time.ZoneOffset.UTC);
    }

    /**
     * Get block hash
     */
    public String getBlock() {
        return block;
    }
}

