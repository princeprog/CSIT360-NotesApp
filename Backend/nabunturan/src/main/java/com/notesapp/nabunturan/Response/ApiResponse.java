package com.notesapp.nabunturan.Response;

/**
 * Generic API response wrapper for REST endpoints.
 * Provides consistent response structure across all endpoints.
 * 
 * @param <T> Type of data being returned
 */
public class ApiResponse<T> {
    
    private String result;    // SUCCESS or ERROR
    private String message;   // success or error message
    private T data;           // return object from service class, if successful

    /**
     * Default constructor
     */
    public ApiResponse() {
    }

    /**
     * Constructor with all fields
     * 
     * @param result Result status (SUCCESS or ERROR)
     * @param message Message describing the result
     * @param data Data payload
     */
    public ApiResponse(String result, String message, T data) {
        this.result = result;
        this.message = message;
        this.data = data;
    }

    /**
     * Create success response with data
     * 
     * @param message Success message
     * @param data Data payload
     * @param <T> Data type
     * @return ApiResponse with SUCCESS status
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>("SUCCESS", message, data);
    }

    /**
     * Create success response without data
     * 
     * @param message Success message
     * @param <T> Data type
     * @return ApiResponse with SUCCESS status and null data
     */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>("SUCCESS", message, null);
    }

    /**
     * Create error response
     * 
     * @param message Error message
     * @param <T> Data type
     * @return ApiResponse with ERROR status
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>("ERROR", message, null);
    }

    // Getters and Setters

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}

