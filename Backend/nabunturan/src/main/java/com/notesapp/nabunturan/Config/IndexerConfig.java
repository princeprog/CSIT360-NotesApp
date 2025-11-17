package com.notesapp.nabunturan.Config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuration class for blockchain indexer settings.
 * Binds properties with prefix 'cardano.indexer' from application.properties.
 */
@Configuration
@ConfigurationProperties(prefix = "cardano.indexer")
public class IndexerConfig {

    /**
     * Enable or disable the blockchain indexer
     */
    private boolean enabled;

    /**
     * Starting slot number for indexing (0 = from genesis)
     */
    private Long startSlot;

    /**
     * Number of blocks to process in a single batch
     */
    private Integer batchSize;

    /**
     * Polling interval in seconds for checking new blocks
     */
    private Integer pollIntervalSeconds;

    /**
     * Metadata label to filter transactions (typically 1 for user-defined metadata)
     */
    private Integer metadataLabel;

    /**
     * List of wallet addresses to monitor for transactions
     */
    private List<String> monitorAddresses;

    /**
     * Default constructor
     */
    public IndexerConfig() {
        this.monitorAddresses = new ArrayList<>();
    }

    /**
     * Constructor with essential fields
     */
    public IndexerConfig(boolean enabled, Long startSlot, Integer batchSize, 
                        Integer pollIntervalSeconds, Integer metadataLabel) {
        this.enabled = enabled;
        this.startSlot = startSlot;
        this.batchSize = batchSize;
        this.pollIntervalSeconds = pollIntervalSeconds;
        this.metadataLabel = metadataLabel;
        this.monitorAddresses = new ArrayList<>();
    }

    // Getters and Setters

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Long getStartSlot() {
        return startSlot;
    }

    public void setStartSlot(Long startSlot) {
        this.startSlot = startSlot;
    }

    public Integer getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(Integer batchSize) {
        this.batchSize = batchSize;
    }

    public Integer getPollIntervalSeconds() {
        return pollIntervalSeconds;
    }

    public void setPollIntervalSeconds(Integer pollIntervalSeconds) {
        this.pollIntervalSeconds = pollIntervalSeconds;
    }

    public Integer getMetadataLabel() {
        return metadataLabel;
    }

    public void setMetadataLabel(Integer metadataLabel) {
        this.metadataLabel = metadataLabel;
    }

    public List<String> getMonitorAddresses() {
        return monitorAddresses;
    }

    public void setMonitorAddresses(List<String> monitorAddresses) {
        this.monitorAddresses = monitorAddresses != null ? monitorAddresses : new ArrayList<>();
    }

    /**
     * Check if indexer is properly configured
     * @return true if all required fields are set
     */
    public boolean isConfigured() {
        return startSlot != null && batchSize != null && batchSize > 0
            && pollIntervalSeconds != null && pollIntervalSeconds > 0
            && metadataLabel != null;
    }

    @Override
    public String toString() {
        return "IndexerConfig{" +
                "enabled=" + enabled +
                ", startSlot=" + startSlot +
                ", batchSize=" + batchSize +
                ", pollIntervalSeconds=" + pollIntervalSeconds +
                ", metadataLabel=" + metadataLabel +
                ", monitorAddresses=" + (monitorAddresses != null ? monitorAddresses.size() + " address(es)" : "none") +
                '}';
    }
}

