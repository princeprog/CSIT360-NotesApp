package com.notesapp.nabunturan.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;

/**
 * DTO representing transaction metadata from Blockfrost API
 */
public record TransactionMetadataDto(
        @JsonProperty("label")
        String label,
        
        @JsonProperty("json_metadata")
        Object jsonMetadata
) {
    /**
     * Compact constructor for validation
     */
    public TransactionMetadataDto {
        if (label == null || label.isBlank()) {
            throw new IllegalArgumentException("Metadata label cannot be empty");
        }
    }

    /**
     * Check if metadata has a specific label
     */
    public boolean hasLabel(Integer expectedLabel) {
        if (expectedLabel == null || label == null) {
            return false;
        }
        try {
            return Integer.parseInt(label) == expectedLabel;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Get metadata label as Integer
     */
    public Integer getLabelAsInt() {
        try {
            return Integer.parseInt(label);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Convert metadata to JSON string
     */
    public String toJson() {
        if (jsonMetadata == null) {
            return null;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(jsonMetadata);
        } catch (JsonProcessingException e) {
            return jsonMetadata.toString();
        }
    }

    /**
     * Get metadata as Map (if possible)
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getMetadataAsMap() {
        if (jsonMetadata instanceof Map) {
            return (Map<String, Object>) jsonMetadata;
        }
        return null;
    }
}

