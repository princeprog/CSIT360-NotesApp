package com.notesapp.nabunturan.Exception;

import com.notesapp.nabunturan.Response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler for all REST controllers.
 * Provides centralized exception handling and consistent error responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Create error response entity
     * 
     * @param message Error message
     * @param status HTTP status
     * @param <T> Response data type
     * @return ResponseEntity with error response
     */
    public static <T> ResponseEntity<ApiResponse<T>> errorResponseEntity(String message, HttpStatus status) {
        ApiResponse<T> response = new ApiResponse<>("ERROR", message, null);
        return new ResponseEntity<>(response, status);
    }

    /**
     * Handle IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return errorResponseEntity(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle NoteNotFoundException
     */
    @ExceptionHandler(NoteNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoteNotFoundException(NoteNotFoundException ex) {
        return errorResponseEntity(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    /**
     * Handle BlockchainIndexException
     * Thrown when blockchain indexing operations fail
     */
    @ExceptionHandler(BlockchainIndexException.class)
    public ResponseEntity<ApiResponse<Object>> handleBlockchainIndexException(BlockchainIndexException ex) {
        return errorResponseEntity("Blockchain indexing error: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handle TransactionNotFoundException
     * Thrown when a requested blockchain transaction is not found
     */
    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleTransactionNotFoundException(TransactionNotFoundException ex) {
        return errorResponseEntity(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    /**
     * Handle BlockfrostApiException
     * Thrown when Blockfrost API calls fail
     */
    @ExceptionHandler(BlockfrostApiException.class)
    public ResponseEntity<ApiResponse<Object>> handleBlockfrostApiException(BlockfrostApiException ex) {
        // Determine appropriate HTTP status based on exception details
        HttpStatus status = HttpStatus.SERVICE_UNAVAILABLE;
        
        if (ex.getStatusCode() != null) {
            // Map Blockfrost status codes to appropriate HTTP status
            switch (ex.getStatusCode()) {
                case 400 -> status = HttpStatus.BAD_REQUEST;
                case 401, 403 -> status = HttpStatus.UNAUTHORIZED;
                case 404 -> status = HttpStatus.NOT_FOUND;
                case 429 -> status = HttpStatus.TOO_MANY_REQUESTS;
                case 500, 502, 503, 504 -> status = HttpStatus.SERVICE_UNAVAILABLE;
                default -> status = HttpStatus.INTERNAL_SERVER_ERROR;
            }
        }
        
        return errorResponseEntity("Blockchain API error: " + ex.getMessage(), status);
    }

    /**
     * Handle generic Exception
     * Catches all other unexpected exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        return errorResponseEntity("An unexpected error occurred: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

