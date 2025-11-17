package com.notesapp.nabunturan.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * DTO representing detailed transaction information from Blockfrost API
 */
public record TransactionDetailsDto(
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
        
        @JsonProperty("output_amount")
        List<AmountDto> outputAmount,
        
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
        Boolean validContract,
        
        @JsonProperty("metadata")
        List<TransactionMetadataDto> metadata
) {
    /**
     * Compact constructor for validation
     */
    public TransactionDetailsDto {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be empty");
        }
    }

    /**
     * Check if transaction has metadata
     */
    public boolean hasMetadata() {
        return metadata != null && !metadata.isEmpty();
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
     * Get block time
     */
    public Long getBlockTime() {
        return blockTime;
    }
}

/**
 * DTO for transaction output amounts
 */
record AmountDto(
        @JsonProperty("unit")
        String unit,
        
        @JsonProperty("quantity")
        String quantity
) {}

