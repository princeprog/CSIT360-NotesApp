/**
 * Error Handling Utilities for Transaction Operations
 * Provides centralized error handling, logging, and user-friendly messages
 */

/**
 * Map of error codes/patterns to user-friendly messages
 */
const ERROR_MESSAGES = {
  // Wallet Errors
  WALLET_NOT_CONNECTED: "Please connect your wallet before performing this action.",
  WALLET_NOT_FOUND: "Wallet extension not found. Please install a Cardano wallet.",
  WALLET_CONNECTION_FAILED: "Failed to connect to wallet. Please try again.",
  USER_DECLINED: "Transaction was cancelled.",
  USER_REJECTED: "You rejected the transaction signature.",
  
  // Transaction Errors
  INSUFFICIENT_FUNDS: "Insufficient ADA to complete the transaction. Please add funds to your wallet.",
  INSUFFICIENT_ADA: "Insufficient ADA for transaction fee.",
  TRANSACTION_FAILED: "Transaction failed to submit. Please try again.",
  TRANSACTION_TIMEOUT: "Transaction timed out. Please check your connection and try again.",
  INVALID_TRANSACTION: "Invalid transaction. Please check your inputs.",
  
  // Metadata Errors
  METADATA_TOO_LARGE: "Note content is too large for blockchain. Please reduce the content size.",
  METADATA_INVALID: "Invalid metadata format. Please check your note content.",
  CHUNK_SIZE_EXCEEDED: "A field in your note exceeds the maximum size limit (64 bytes).",
  
  // Network Errors
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  BLOCKFROST_ERROR: "Unable to connect to blockchain. Please try again later.",
  BLOCKFROST_UNAUTHORIZED: "Blockfrost API key is invalid or missing.",
  BLOCKFROST_RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  
  // Signing Errors
  SIGNING_FAILED: "Failed to sign transaction. Please try again.",
  SIGNING_CANCELLED: "Transaction signing was cancelled.",
  
  // Generic
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  INVALID_ADDRESS: "Invalid wallet address format.",
  INVALID_AMOUNT: "Invalid transaction amount.",
};

/**
 * Get user-friendly error message from error code or error object
 * @param {string|Error} errorCode - Error code string or Error object
 * @returns {string} - User-friendly error message
 */
export const getErrorMessage = (errorCode) => {
  // Handle Error objects
  if (errorCode instanceof Error) {
    const message = errorCode.message.toLowerCase();
    
    // Check for specific error patterns in message
    if (message.includes('user declined') || message.includes('user rejected')) {
      return ERROR_MESSAGES.USER_REJECTED;
    }
    if (message.includes('insufficient') && message.includes('fund')) {
      return ERROR_MESSAGES.INSUFFICIENT_FUNDS;
    }
    if (message.includes('insufficient') && message.includes('ada')) {
      return ERROR_MESSAGES.INSUFFICIENT_ADA;
    }
    if (message.includes('network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('metadata') && message.includes('large')) {
      return ERROR_MESSAGES.METADATA_TOO_LARGE;
    }
    if (message.includes('exceed') && message.includes('64')) {
      return ERROR_MESSAGES.CHUNK_SIZE_EXCEEDED;
    }
    if (message.includes('wallet') && message.includes('not connected')) {
      return ERROR_MESSAGES.WALLET_NOT_CONNECTED;
    }
    if (message.includes('blockfrost') || message.includes('api')) {
      return ERROR_MESSAGES.BLOCKFROST_ERROR;
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return ERROR_MESSAGES.BLOCKFROST_UNAUTHORIZED;
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return ERROR_MESSAGES.BLOCKFROST_RATE_LIMIT;
    }
    
    // Return original message if no pattern matches
    return errorCode.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // Handle string error codes
  if (typeof errorCode === 'string') {
    const upperCode = errorCode.toUpperCase().replace(/\s+/g, '_');
    return ERROR_MESSAGES[upperCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Centralized transaction error handling
 * Maps errors to user-friendly messages based on operation type
 * @param {Error} error - The error object
 * @param {string} operation - Operation type (CREATE, UPDATE, DELETE)
 * @returns {string} - User-friendly error message
 */
export const handleTransactionError = (error, operation = 'TRANSACTION') => {
  // Log the error for debugging
  logTransactionError(error, { operation });
  
  // Get base error message
  let errorMessage = getErrorMessage(error);
  
  // Add operation context
  const operationContext = {
    CREATE: "creating the note",
    UPDATE: "updating the note",
    DELETE: "deleting the note",
    TRANSACTION: "processing the transaction",
  };
  
  const context = operationContext[operation.toUpperCase()] || "performing this action";
  
  // Handle specific error types
  if (error.message?.includes('User declined') || error.message?.includes('rejected')) {
    return `Transaction cancelled. Your note was not ${operation.toLowerCase()}d.`;
  }
  
  if (error.message?.includes('insufficient')) {
    return `${errorMessage} Unable to complete ${context}.`;
  }
  
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return `Network error while ${context}. Please check your connection and try again.`;
  }
  
  if (error.message?.includes('Blockfrost') || error.message?.includes('API')) {
    return `Unable to connect to blockchain while ${context}. Please try again later.`;
  }
  
  if (error.message?.includes('metadata') || error.message?.includes('chunk')) {
    return `${errorMessage} Unable to ${operation.toLowerCase()} the note.`;
  }
  
  // Return generic error with context
  return `Error ${context}: ${errorMessage}`;
};

/**
 * Log transaction errors with context for debugging
 * @param {Error} error - The error object
 * @param {object} context - Additional context (noteId, operation, txHash, etc.)
 */
export const logTransactionError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context: {
      operation: context.operation || 'UNKNOWN',
      noteId: context.noteId || null,
      txHash: context.txHash || null,
      walletAddress: context.walletAddress || null,
      metadata: context.metadata || null,
    },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
  };
  
  // Log to console in development
  if (import.meta.env.MODE === 'development') {
    console.group(`🔴 Transaction Error [${context.operation || 'UNKNOWN'}]`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.table(context);
    console.groupEnd();
  }
  
  // In production, you might want to send this to a logging service
  // Example: sendToLoggingService(logEntry);
  
  return logEntry;
};

/**
 * Check if error is a user cancellation
 * @param {Error} error - The error object
 * @returns {boolean} - True if user cancelled
 */
export const isUserCancellation = (error) => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('user declined') ||
    message.includes('user rejected') ||
    message.includes('cancelled') ||
    message.includes('canceled')
  );
};

/**
 * Check if error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} - True if network error
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  );
};

/**
 * Check if error is an insufficient funds error
 * @param {Error} error - The error object
 * @returns {boolean} - True if insufficient funds
 */
export const isInsufficientFundsError = (error) => {
  if (!error) return false;
  const message = error.message?.toLowerCase() || '';
  return (
    message.includes('insufficient') &&
    (message.includes('fund') || message.includes('ada') || message.includes('balance'))
  );
};

/**
 * Format error for display to user
 * @param {Error} error - The error object
 * @param {string} operation - Operation type
 * @returns {object} - Formatted error object with title and message
 */
export const formatErrorForDisplay = (error, operation = 'TRANSACTION') => {
  const isUserCancel = isUserCancellation(error);
  
  return {
    title: isUserCancel ? 'Transaction Cancelled' : 'Error',
    message: handleTransactionError(error, operation),
    type: isUserCancel ? 'warning' : 'error',
    dismissible: true,
  };
};
