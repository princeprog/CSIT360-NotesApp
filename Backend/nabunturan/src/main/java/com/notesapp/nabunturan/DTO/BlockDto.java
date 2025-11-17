package com.notesapp.nabunturan.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing a Cardano block from Blockfrost API
 */
public record BlockDto(
        @JsonProperty("hash")
        String hash,
        
        @JsonProperty("epoch")
        Integer epoch,
        
        @JsonProperty("slot")
        Long slot,
        
        @JsonProperty("epoch_slot")
        Long epochSlot,
        
        @JsonProperty("height")
        Long height,
        
        @JsonProperty("time")
        Long time,
        
        @JsonProperty("tx_count")
        Integer txCount,
        
        @JsonProperty("size")
        Integer size,
        
        @JsonProperty("block_vrf")
        String blockVrf,
        
        @JsonProperty("previous_block")
        String previousBlock,
        
        @JsonProperty("next_block")
        String nextBlock,
        
        @JsonProperty("confirmations")
        Integer confirmations
) {
    /**
     * Compact constructor for validation
     */
    public BlockDto {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("Block hash cannot be empty");
        }
        if (height == null || height < 0) {
            throw new IllegalArgumentException("Block height cannot be null or negative");
        }
    }

    /**
     * Get block height (alias for consistency)
     */
    public Long getHeight() {
        return height;
    }

    /**
     * Get block hash
     */
    public String getHash() {
        return hash;
    }

    /**
     * Get transaction count
     */
    public Integer getTxCount() {
        return txCount != null ? txCount : 0;
    }
}

