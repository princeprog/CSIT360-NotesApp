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
     * Handle generic Exception
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        return errorResponseEntity("An unexpected error occurred: " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

