package com.notesapp.nabunturan.Service;

import com.notesapp.nabunturan.Config.BlockfrostConfig;
import com.notesapp.nabunturan.DTO.AddressTransactionDto;
import com.notesapp.nabunturan.DTO.BlockDto;
import com.notesapp.nabunturan.DTO.TransactionDetailsDto;
import com.notesapp.nabunturan.DTO.TransactionMetadataDto;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * Service class for interacting with Blockfrost API.
 * Provides methods to query Cardano blockchain data.
 * 
 * According to backend rules:
 * - This is a Service class (interface not required for external API clients)
 * - Uses @Service annotation
 * - Dependencies autowired
 * - All methods include proper error handling
 */
@Service
public class BlockfrostClient {

    private final BlockfrostConfig config;
    private RestTemplate restTemplate;

    @Autowired
    public BlockfrostClient(BlockfrostConfig config) {
        this.config = config;
    }

    /**
     * Initialize the REST template with Blockfrost API key header
     */
    @PostConstruct
    public void init() {
        this.restTemplate = new RestTemplate();
        // RestTemplate is ready, headers will be added per request
    }

    /**
     * Create HTTP headers with Blockfrost project ID for authentication
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("project_id", config.getProjectId());
        headers.set("Content-Type", "application/json");
        return headers;
    }

    /**
     * Build full URL for Blockfrost API endpoint
     */
    private String buildUrl(String endpoint) {
        String baseUrl = config.getBaseUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        if (!endpoint.startsWith("/")) {
            endpoint = "/" + endpoint;
        }
        return baseUrl + endpoint;
    }

    /**
     * Get the latest block from the blockchain
     * 
     * @return BlockDto containing latest block information
     * @throws RuntimeException if API call fails
     */
    public BlockDto getLatestBlock() {
        if (!config.isConfigured()) {
            throw new IllegalStateException("Blockfrost is not properly configured");
        }

        try {
            String url = buildUrl("/blocks/latest");
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());

            ResponseEntity<BlockDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    BlockDto.class
            );

            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Blockfrost API client error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Blockfrost API server error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (RestClientException e) {
            throw new RuntimeException("Failed to connect to Blockfrost API: " + e.getMessage(), e);
        }
    }

    /**
     * Get all transactions in a specific block
     * 
     * @param blockHashOrNumber Block hash or block number
     * @return List of transaction hashes in the block
     * @throws RuntimeException if API call fails
     */
    public List<String> getBlockTransactions(String blockHashOrNumber) {
        if (!config.isConfigured()) {
            throw new IllegalStateException("Blockfrost is not properly configured");
        }

        if (blockHashOrNumber == null || blockHashOrNumber.isBlank()) {
            throw new IllegalArgumentException("Block hash or number cannot be empty");
        }

        try {
            String url = buildUrl("/blocks/" + blockHashOrNumber + "/txs");
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());

            ResponseEntity<List<String>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<String>>() {}
            );

            return response.getBody() != null ? response.getBody() : new ArrayList<>();
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Blockfrost API client error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Blockfrost API server error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (RestClientException e) {
            throw new RuntimeException("Failed to connect to Blockfrost API: " + e.getMessage(), e);
        }
    }

    /**
     * Get transaction metadata for a specific transaction
     * 
     * @param txHash Transaction hash
     * @return List of TransactionMetadataDto containing transaction metadata
     * @throws RuntimeException if API call fails
     */
    public List<TransactionMetadataDto> getTransactionMetadata(String txHash) {
        if (!config.isConfigured()) {
            throw new IllegalStateException("Blockfrost is not properly configured");
        }

        if (txHash == null || txHash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be empty");
        }

        try {
            String url = buildUrl("/txs/" + txHash + "/metadata");
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());

            ResponseEntity<List<TransactionMetadataDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<TransactionMetadataDto>>() {}
            );

            return response.getBody() != null ? response.getBody() : new ArrayList<>();
        } catch (HttpClientErrorException.NotFound e) {
            // Transaction has no metadata
            return new ArrayList<>();
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Blockfrost API client error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Blockfrost API server error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (RestClientException e) {
            throw new RuntimeException("Failed to connect to Blockfrost API: " + e.getMessage(), e);
        }
    }

    /**
     * Get detailed transaction information
     * 
     * @param txHash Transaction hash
     * @return TransactionDetailsDto containing transaction details
     * @throws RuntimeException if API call fails
     */
    public TransactionDetailsDto getTransactionDetails(String txHash) {
        if (!config.isConfigured()) {
            throw new IllegalStateException("Blockfrost is not properly configured");
        }

        if (txHash == null || txHash.isBlank()) {
            throw new IllegalArgumentException("Transaction hash cannot be empty");
        }

        try {
            String url = buildUrl("/txs/" + txHash);
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());

            ResponseEntity<TransactionDetailsDto> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    TransactionDetailsDto.class
            );

            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Blockfrost API client error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Blockfrost API server error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (RestClientException e) {
            throw new RuntimeException("Failed to connect to Blockfrost API: " + e.getMessage(), e);
        }
    }

    /**
     * Get transactions for a specific address with pagination
     * 
     * @param address Cardano address (bech32)
     * @param page Page number (1-based)
     * @return List of AddressTransactionDto containing address transactions
     * @throws RuntimeException if API call fails
     */
    public List<AddressTransactionDto> getAddressTransactions(String address, Integer page) {
        if (!config.isConfigured()) {
            throw new IllegalStateException("Blockfrost is not properly configured");
        }

        if (address == null || address.isBlank()) {
            throw new IllegalArgumentException("Address cannot be empty");
        }

        if (page == null || page < 1) {
            page = 1;
        }

        try {
            String url = buildUrl("/addresses/" + address + "/transactions?page=" + page);
            HttpEntity<String> entity = new HttpEntity<>(createHeaders());

            ResponseEntity<List<AddressTransactionDto>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<List<AddressTransactionDto>>() {}
            );

            return response.getBody() != null ? response.getBody() : new ArrayList<>();
        } catch (HttpClientErrorException.NotFound e) {
            // Address has no transactions
            return new ArrayList<>();
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Blockfrost API client error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Blockfrost API server error: " + e.getStatusCode() + " - " + e.getMessage(), e);
        } catch (RestClientException e) {
            throw new RuntimeException("Failed to connect to Blockfrost API: " + e.getMessage(), e);
        }
    }

    /**
     * Check if Blockfrost client is properly configured and ready to use
     * 
     * @return true if configured, false otherwise
     */
    public boolean isConfigured() {
        return config.isConfigured();
    }

    /**
     * Get the configured network name
     * 
     * @return Network name (e.g., "preview", "mainnet")
     */
    public String getNetwork() {
        return config.getNetwork();
    }
}

