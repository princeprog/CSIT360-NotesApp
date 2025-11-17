package com.notesapp.nabunturan.Exception;

/**
 * Exception thrown when Blockfrost API calls fail.
 * This includes network errors, API errors, authentication failures, and rate limiting.
 */
public class BlockfrostApiException extends RuntimeException {

    private final Integer statusCode;
    private final String endpoint;

    /**
     * Constructor with message
     * 
     * @param message Exception message describing the API error
     */
    public BlockfrostApiException(String message) {
        super(message);
        this.statusCode = null;
        this.endpoint = null;
    }

    /**
     * Constructor with message and cause
     * 
     * @param message Exception message describing the API error
     * @param cause Throwable cause of the exception (network error, etc.)
     */
    public BlockfrostApiException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = null;
        this.endpoint = null;
    }

    /**
     * Constructor with message, status code, and endpoint
     * 
     * @param message Exception message
     * @param statusCode HTTP status code from Blockfrost API
     * @param endpoint API endpoint that failed
     */
    public BlockfrostApiException(String message, Integer statusCode, String endpoint) {
        super(message);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
    }

    /**
     * Constructor with all details
     * 
     * @param message Exception message
     * @param cause Throwable cause
     * @param statusCode HTTP status code
     * @param endpoint API endpoint that failed
     */
    public BlockfrostApiException(String message, Throwable cause, Integer statusCode, String endpoint) {
        super(message, cause);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
    }

    /**
     * Get HTTP status code from the failed API call
     * 
     * @return HTTP status code, or null if not applicable
     */
    public Integer getStatusCode() {
        return statusCode;
    }

    /**
     * Get the API endpoint that failed
     * 
     * @return API endpoint path, or null if not applicable
     */
    public String getEndpoint() {
        return endpoint;
    }

    /**
     * Constructor for authentication failure
     * 
     * @return BlockfrostApiException for authentication error
     */
    public static BlockfrostApiException authenticationFailed() {
        return new BlockfrostApiException(
            "Blockfrost API authentication failed. Please check your project ID.",
            401,
            null
        );
    }

    /**
     * Constructor for rate limiting
     * 
     * @return BlockfrostApiException for rate limit error
     */
    public static BlockfrostApiException rateLimitExceeded() {
        return new BlockfrostApiException(
            "Blockfrost API rate limit exceeded. Please try again later.",
            429,
            null
        );
    }

    /**
     * Constructor for network error
     * 
     * @param cause Network exception
     * @return BlockfrostApiException for network error
     */
    public static BlockfrostApiException networkError(Throwable cause) {
        return new BlockfrostApiException(
            "Failed to connect to Blockfrost API. Please check your network connection.",
            cause
        );
    }

    /**
     * Constructor for API error with status code and endpoint
     * 
     * @param statusCode HTTP status code
     * @param endpoint API endpoint
     * @param message Error message from API
     * @return BlockfrostApiException with details
     */
    public static BlockfrostApiException apiError(Integer statusCode, String endpoint, String message) {
        return new BlockfrostApiException(
            String.format("Blockfrost API error: %s", message),
            statusCode,
            endpoint
        );
    }

    /**
     * Constructor for resource not found on blockchain
     * 
     * @param resource Resource type (block, transaction, etc.)
     * @param identifier Resource identifier
     * @return BlockfrostApiException for not found error
     */
    public static BlockfrostApiException resourceNotFound(String resource, String identifier) {
        return new BlockfrostApiException(
            String.format("Blockfrost API: %s not found with identifier: %s", resource, identifier),
            404,
            null
        );
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("BlockfrostApiException: ");
        sb.append(getMessage());
        if (statusCode != null) {
            sb.append(" [Status Code: ").append(statusCode).append("]");
        }
        if (endpoint != null) {
            sb.append(" [Endpoint: ").append(endpoint).append("]");
        }
        return sb.toString();
    }
}

