package com.notesapp.nabunturan.Exception;

/**
 * Exception thrown when Blockfrost API calls fail
 */
public class BlockfrostApiException extends RuntimeException {

    private int statusCode;
    private String apiEndpoint;
    private String errorDetails;

    public BlockfrostApiException(String message) {
        super(message);
    }

    public BlockfrostApiException(String message, Throwable cause) {
        super(message, cause);
    }

    public BlockfrostApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public BlockfrostApiException(String message, int statusCode, String apiEndpoint) {
        super(message);
        this.statusCode = statusCode;
        this.apiEndpoint = apiEndpoint;
    }

    public BlockfrostApiException(String message, int statusCode, String apiEndpoint, String errorDetails) {
        super(message);
        this.statusCode = statusCode;
        this.apiEndpoint = apiEndpoint;
        this.errorDetails = errorDetails;
    }

    public BlockfrostApiException(String message, String apiEndpoint, Throwable cause) {
        super(message, cause);
        this.apiEndpoint = apiEndpoint;
    }

    public static BlockfrostApiException networkError(String endpoint, Throwable cause) {
        return new BlockfrostApiException(
            "Failed to connect to Blockfrost API at " + endpoint,
            endpoint,
            cause
        );
    }

    public static BlockfrostApiException apiError(int statusCode, String endpoint, String errorDetails) {
        return new BlockfrostApiException(
            "Blockfrost API returned error status " + statusCode,
            statusCode,
            endpoint,
            errorDetails
        );
    }

    public static BlockfrostApiException transactionNotFound(String txHash) {
        return new BlockfrostApiException(
            "Transaction not found on blockchain: " + txHash,
            404,
            "/txs/" + txHash
        );
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getApiEndpoint() {
        return apiEndpoint;
    }

    public String getErrorDetails() {
        return errorDetails;
    }
}
