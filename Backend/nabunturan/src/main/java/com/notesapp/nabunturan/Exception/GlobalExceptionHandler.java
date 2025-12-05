package com.notesapp.nabunturan.Exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Global exception handler for mapping exceptions to HTTP status codes
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle TransactionNotFoundException - 404 Not Found
     */
    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTransactionNotFoundException(
            TransactionNotFoundException ex, WebRequest request) {
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        
        if (ex.getTransactionId() != null) {
            errorResponse.addDetail("transactionId", ex.getTransactionId().toString());
        }
        if (ex.getTxHash() != null) {
            errorResponse.addDetail("txHash", ex.getTxHash());
        }
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle BlockfrostApiException - 502 Bad Gateway
     */
    @ExceptionHandler(BlockfrostApiException.class)
    public ResponseEntity<ErrorResponse> handleBlockfrostApiException(
            BlockfrostApiException ex, WebRequest request) {
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_GATEWAY.value(),
            "Blockchain API error: " + ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        
        if (ex.getApiEndpoint() != null) {
            errorResponse.addDetail("apiEndpoint", ex.getApiEndpoint());
        }
        if (ex.getStatusCode() > 0) {
            errorResponse.addDetail("apiStatusCode", String.valueOf(ex.getStatusCode()));
        }
        if (ex.getErrorDetails() != null) {
            errorResponse.addDetail("errorDetails", ex.getErrorDetails());
        }
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_GATEWAY);
    }

    /**
     * Handle TransactionExpiredException - 408 Request Timeout
     */
    @ExceptionHandler(TransactionExpiredException.class)
    public ResponseEntity<ErrorResponse> handleTransactionExpiredException(
            TransactionExpiredException ex, WebRequest request) {
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.REQUEST_TIMEOUT.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        
        if (ex.getTransactionId() != null) {
            errorResponse.addDetail("transactionId", ex.getTransactionId().toString());
        }
        if (ex.getTxHash() != null) {
            errorResponse.addDetail("txHash", ex.getTxHash());
        }
        if (ex.getWaitingMinutes() > 0) {
            errorResponse.addDetail("waitingMinutes", String.valueOf(ex.getWaitingMinutes()));
        }
        
        return new ResponseEntity<>(errorResponse, HttpStatus.REQUEST_TIMEOUT);
    }

    /**
     * Handle InvalidTransactionStatusException - 400 Bad Request
     */
    @ExceptionHandler(InvalidTransactionStatusException.class)
    public ResponseEntity<ErrorResponse> handleInvalidTransactionStatusException(
            InvalidTransactionStatusException ex, WebRequest request) {
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        
        if (ex.getTransactionId() != null) {
            errorResponse.addDetail("transactionId", ex.getTransactionId().toString());
        }
        if (ex.getTxHash() != null) {
            errorResponse.addDetail("txHash", ex.getTxHash());
        }
        if (ex.getCurrentStatus() != null) {
            errorResponse.addDetail("currentStatus", ex.getCurrentStatus());
        }
        if (ex.getAttemptedStatus() != null) {
            errorResponse.addDetail("attemptedStatus", ex.getAttemptedStatus());
        }
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle validation errors for request body - 400 Bad Request
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            request.getDescription(false).replace("uri=", "")
        );
        
        Map<String, String> validationErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            validationErrors.put(fieldName, errorMessage);
        });
        
        errorResponse.addDetail("validationErrors", validationErrors);
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle validation errors for path variables and request parameters - 400 Bad Request
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            ConstraintViolationException ex, WebRequest request) {
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            request.getDescription(false).replace("uri=", "")
        );
        
        Map<String, String> validationErrors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String propertyPath = violation.getPropertyPath().toString();
            String message = violation.getMessage();
            // Extract just the parameter name (e.g., "txHash" from "getTransactionByHash.txHash")
            String paramName = propertyPath.contains(".") 
                ? propertyPath.substring(propertyPath.lastIndexOf('.') + 1) 
                : propertyPath;
            validationErrors.put(paramName, message);
        }
        
        errorResponse.addDetail("validationErrors", validationErrors);
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle generic exceptions - 500 Internal Server Error
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, WebRequest request) {
        
        ErrorResponse errorResponse = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred: " + ex.getMessage(),
            request.getDescription(false).replace("uri=", "")
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Error response structure
     */
    public static class ErrorResponse {
        private LocalDateTime timestamp;
        private int status;
        private String message;
        private String path;
        private Map<String, Object> details;

        public ErrorResponse(int status, String message, String path) {
            this.timestamp = LocalDateTime.now();
            this.status = status;
            this.message = message;
            this.path = path;
            this.details = new HashMap<>();
        }

        public void addDetail(String key, Object value) {
            this.details.put(key, value);
        }

        // Getters and Setters

        public LocalDateTime getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
        }

        public int getStatus() {
            return status;
        }

        public void setStatus(int status) {
            this.status = status;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public Map<String, Object> getDetails() {
            return details;
        }

        public void setDetails(Map<String, Object> details) {
            this.details = details;
        }
    }
}
