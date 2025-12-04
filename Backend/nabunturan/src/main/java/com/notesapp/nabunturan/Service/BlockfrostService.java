package com.notesapp.nabunturan.Service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class BlockfrostService {

    @Value("${blockfrost.api.url}")
    private String blockfrostApiUrl;

    @Value("${blockfrost.project.id}")
    private String projectId;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get transaction details from Blockfrost API
     * @param txHash The transaction hash
     * @return Map containing transaction details
     */
    public Map<String, Object> getTransactionDetails(String txHash) {
        try {
            String url = blockfrostApiUrl + "/txs/" + txHash;
            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                Map<String, Object> details = new HashMap<>();
                
                details.put("hash", jsonNode.path("hash").asText());
                details.put("block", jsonNode.path("block").asText());
                details.put("block_height", jsonNode.path("block_height").asLong());
                details.put("block_time", jsonNode.path("block_time").asLong());
                details.put("slot", jsonNode.path("slot").asLong());
                details.put("index", jsonNode.path("index").asInt());
                details.put("fees", jsonNode.path("fees").asText());
                details.put("size", jsonNode.path("size").asInt());
                details.put("invalid_before", jsonNode.path("invalid_before").asText(null));
                details.put("invalid_hereafter", jsonNode.path("invalid_hereafter").asText(null));
                details.put("utxo_count", jsonNode.path("utxo_count").asInt());
                details.put("withdrawal_count", jsonNode.path("withdrawal_count").asInt());
                details.put("delegation_count", jsonNode.path("delegation_count").asInt());
                details.put("valid_contract", jsonNode.path("valid_contract").asBoolean());

                return details;
            } else {
                throw new RuntimeException("Failed to fetch transaction details: " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new RuntimeException("Transaction not found: " + txHash);
            }
            throw new RuntimeException("Blockfrost API client error: " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Blockfrost API server error: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching transaction details: " + e.getMessage(), e);
        }
    }

    /**
     * Check if a transaction is confirmed on the blockchain
     * @param txHash The transaction hash
     * @return true if transaction is confirmed, false otherwise
     */
    public boolean isTransactionConfirmed(String txHash) {
        try {
            Map<String, Object> details = getTransactionDetails(txHash);
            
            // If we can retrieve transaction details and it has a block height, it's confirmed
            if (details.containsKey("block_height")) {
                Long blockHeight = (Long) details.get("block_height");
                return blockHeight != null && blockHeight > 0;
            }
            
            return false;
        } catch (Exception e) {
            // If transaction is not found or any error occurs, it's not confirmed
            return false;
        }
    }

    /**
     * Get transaction metadata from Blockfrost API
     * @param txHash The transaction hash
     * @return Map containing transaction metadata
     */
    public Map<String, Object> getTransactionMetadata(String txHash) {
        try {
            String url = blockfrostApiUrl + "/txs/" + txHash + "/metadata";
            HttpHeaders headers = createHeaders();
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                Map<String, Object> metadata = new HashMap<>();
                
                // Parse metadata array
                if (jsonNode.isArray() && jsonNode.size() > 0) {
                    for (JsonNode metadataEntry : jsonNode) {
                        String label = metadataEntry.path("label").asText();
                        JsonNode jsonMetadata = metadataEntry.path("json_metadata");
                        
                        // Convert JsonNode to Map
                        @SuppressWarnings("unchecked")
                        Map<String, Object> metadataMap = objectMapper.convertValue(
                            jsonMetadata, 
                            Map.class
                        );
                        metadata.put("label_" + label, metadataMap);
                    }
                } else {
                    metadata.put("message", "No metadata found for this transaction");
                }
                
                return metadata;
            } else {
                throw new RuntimeException("Failed to fetch transaction metadata: " + response.getStatusCode());
            }

        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                Map<String, Object> emptyMetadata = new HashMap<>();
                emptyMetadata.put("message", "No metadata found for transaction: " + txHash);
                return emptyMetadata;
            }
            throw new RuntimeException("Blockfrost API client error: " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            throw new RuntimeException("Blockfrost API server error: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Error fetching transaction metadata: " + e.getMessage(), e);
        }
    }

    /**
     * Create HTTP headers with project_id for Blockfrost API authentication
     * @return HttpHeaders with project_id
     */
    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("project_id", projectId);
        headers.set("Content-Type", "application/json");
        return headers;
    }

    /**
     * Validate if the Blockfrost service is properly configured
     * @return true if configured, false otherwise
     */
    public boolean isConfigured() {
        return projectId != null && !projectId.isEmpty() && !projectId.equals("${blockfrost.project.id}");
    }

    /**
     * Get the current Blockfrost API URL
     * @return The API URL
     */
    public String getApiUrl() {
        return blockfrostApiUrl;
    }
}
