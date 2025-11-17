package com.notesapp.nabunturan.DTO;

import java.time.LocalDateTime;

/**
 * DTO for blockchain indexer status information.
 * Used for monitoring and status endpoints.
 * 
 * According to backend rules:
 * - Record type
 * - Compact constructor for validation
 * - Used for status reporting
 */
public record IndexerStatusDto(
        boolean enabled,
        boolean running,
        String network,
        Long currentBlockHeight,
        Long latestIndexedBlock,
        LocalDateTime lastIndexedAt,
        Long totalTransactionsIndexed,
        Long pendingTransactions,
        Long confirmedTransactions,
        Long failedTransactions,
        Integer monitoredAddressesCount,
        String blockfrostStatus,
        LocalDateTime startedAt,
        String errorMessage
) {
    /**
     * Compact canonical constructor for validation
     */
    public IndexerStatusDto {
        // Network is required if enabled
        if (enabled && (network == null || network.isBlank())) {
            throw new IllegalArgumentException("Network cannot be null or blank when indexer is enabled");
        }
    }

    /**
     * Check if indexer is operational
     */
    public boolean isOperational() {
        return enabled && running && errorMessage == null;
    }

    /**
     * Check if indexer has errors
     */
    public boolean hasErrors() {
        return errorMessage != null && !errorMessage.isBlank();
    }

    /**
     * Check if indexer is behind current block height
     */
    public boolean isBehind() {
        if (currentBlockHeight == null || latestIndexedBlock == null) {
            return false;
        }
        return currentBlockHeight > latestIndexedBlock;
    }

    /**
     * Get number of blocks behind
     */
    public Long getBlocksBehind() {
        if (currentBlockHeight == null || latestIndexedBlock == null) {
            return 0L;
        }
        return Math.max(0L, currentBlockHeight - latestIndexedBlock);
    }

    /**
     * Get indexing progress percentage
     */
    public double getProgressPercentage() {
        if (currentBlockHeight == null || latestIndexedBlock == null || currentBlockHeight == 0) {
            return 0.0;
        }
        return (latestIndexedBlock.doubleValue() / currentBlockHeight.doubleValue()) * 100.0;
    }

    /**
     * Check if indexer is up to date
     */
    public boolean isUpToDate() {
        if (currentBlockHeight == null || latestIndexedBlock == null) {
            return false;
        }
        // Consider up to date if within 5 blocks
        return getBlocksBehind() <= 5;
    }

    /**
     * Check if Blockfrost is available
     */
    public boolean isBlockfrostAvailable() {
        return blockfrostStatus != null && blockfrostStatus.equalsIgnoreCase("AVAILABLE");
    }

    /**
     * Get total transactions indexed
     */
    public Long getTotalTransactions() {
        return totalTransactionsIndexed != null ? totalTransactionsIndexed : 0L;
    }

    /**
     * Get uptime in seconds
     */
    public long getUptimeSeconds() {
        if (startedAt == null) {
            return 0;
        }
        return java.time.Duration.between(startedAt, LocalDateTime.now()).getSeconds();
    }

    /**
     * Check if indexer has been running
     */
    public boolean hasUptime() {
        return startedAt != null;
    }

    /**
     * Get time since last index in seconds
     */
    public long getSecondsSinceLastIndex() {
        if (lastIndexedAt == null) {
            return -1;
        }
        return java.time.Duration.between(lastIndexedAt, LocalDateTime.now()).getSeconds();
    }
}

