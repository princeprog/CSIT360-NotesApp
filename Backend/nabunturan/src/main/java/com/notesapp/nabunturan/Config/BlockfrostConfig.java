package com.notesapp.nabunturan.Config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for Blockfrost API settings.
 * Binds properties with prefix 'cardano.blockfrost' from application.properties.
 */
@Configuration
@ConfigurationProperties(prefix = "cardano.blockfrost")
public class BlockfrostConfig {

    /**
     * Blockfrost project ID for API authentication
     */
    private String projectId;

    /**
     * Cardano network to connect to (e.g., 'preview', 'mainnet', 'preprod')
     */
    private String network;

    /**
     * Base URL for Blockfrost API
     */
    private String baseUrl;

    /**
     * Default constructor
     */
    public BlockfrostConfig() {
    }

    /**
     * Constructor with all fields
     */
    public BlockfrostConfig(String projectId, String network, String baseUrl) {
        this.projectId = projectId;
        this.network = network;
        this.baseUrl = baseUrl;
    }

    // Getters and Setters

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * Check if Blockfrost is properly configured
     * @return true if project ID and base URL are set
     */
    public boolean isConfigured() {
        return projectId != null && !projectId.isEmpty() 
            && baseUrl != null && !baseUrl.isEmpty();
    }

    @Override
    public String toString() {
        return "BlockfrostConfig{" +
                "projectId='" + (projectId != null && !projectId.isEmpty() ? "***" : "not set") + '\'' +
                ", network='" + network + '\'' +
                ", baseUrl='" + baseUrl + '\'' +
                '}';
    }
}

