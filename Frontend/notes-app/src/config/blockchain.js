/**
 * Blockchain Configuration
 * Centralized configuration for Cardano blockchain integration
 */

/**
 * Main blockchain configuration constants
 */
export const BLOCKCHAIN_CONFIG = {
  // Cardano Network (Preview Testnet)
  NETWORK: 'preview',
  
  // Cardano Explorer URL for transaction viewing
  CARDANO_EXPLORER_URL: 'https://preview.cardanoscan.io',
  
  // Maximum size for metadata chunk (Cardano limit is 64 bytes per string)
  MAX_METADATA_CHUNK_SIZE: 64,
  
  // Transaction timeout in milliseconds (5 minutes)
  TRANSACTION_TIMEOUT: 5 * 60 * 1000,
  
  // Polling interval for checking transaction status (20 seconds)
  POLLING_INTERVAL: 20 * 1000,
  
  // Estimated time for transaction confirmation (2-3 minutes)
  ESTIMATED_CONFIRMATION_TIME: 2.5 * 60 * 1000,
  
  // Metadata label for Notes App transactions
  METADATA_LABEL: 42819n,
  
  // App identifier in metadata
  APP_NAME: 'NotesApp',
  
  // Maximum retries for transaction submission
  MAX_RETRIES: 3,
  
  // Retry delay in milliseconds
  RETRY_DELAY: 2000,
};

/**
 * Transaction Status Enum
 * Represents the current state of a blockchain transaction
 */
export const TRANSACTION_STATUS = {
  // Transaction is being built/prepared
  BUILDING: 'BUILDING',
  
  // Transaction is pending (submitted to blockchain but not confirmed)
  PENDING: 'PENDING',
  
  // Transaction is confirmed on blockchain
  CONFIRMED: 'CONFIRMED',
  
  // Transaction failed to submit or was rejected
  FAILED: 'FAILED',
  
  // Transaction was cancelled by user
  CANCELLED: 'CANCELLED',
  
  // Transaction is being verified
  VERIFYING: 'VERIFYING',
  
  // No transaction associated
  NONE: 'NONE',
};

/**
 * Transaction Operations Enum
 * Defines the type of note operation performed on blockchain
 */
export const TRANSACTION_OPERATIONS = {
  // Create a new note
  CREATE: 'CREATE',
  
  // Update an existing note
  UPDATE: 'UPDATE',
  
  // Delete a note
  DELETE: 'DELETE',
  
  // Pin/Unpin a note
  PIN: 'PIN',
  
  // Change note category
  CATEGORY_CHANGE: 'CATEGORY_CHANGE',
};

/**
 * Get explorer URL for a specific transaction
 * @param {string} txHash - Transaction hash
 * @returns {string} - Full URL to view transaction on explorer
 */
export const getExplorerUrl = (txHash) => {
  if (!txHash) return BLOCKCHAIN_CONFIG.CARDANO_EXPLORER_URL;
  return `${BLOCKCHAIN_CONFIG.CARDANO_EXPLORER_URL}/transaction/${txHash}`;
};

/**
 * Get status badge color based on transaction status
 * @param {string} status - Transaction status
 * @returns {string} - Tailwind CSS color class
 */
export const getStatusColor = (status) => {
  const statusUpper = status?.toUpperCase();
  
  switch (statusUpper) {
    case TRANSACTION_STATUS.BUILDING:
      return 'bg-blue-100 text-blue-800';
    case TRANSACTION_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case TRANSACTION_STATUS.CONFIRMED:
      return 'bg-green-100 text-green-800';
    case TRANSACTION_STATUS.FAILED:
      return 'bg-red-100 text-red-800';
    case TRANSACTION_STATUS.CANCELLED:
      return 'bg-gray-100 text-gray-800';
    case TRANSACTION_STATUS.VERIFYING:
      return 'bg-purple-100 text-purple-800';
    case TRANSACTION_STATUS.NONE:
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

/**
 * Get status display text
 * @param {string} status - Transaction status
 * @returns {string} - User-friendly status text
 */
export const getStatusText = (status) => {
  const statusUpper = status?.toUpperCase();
  
  switch (statusUpper) {
    case TRANSACTION_STATUS.BUILDING:
      return 'Building...';
    case TRANSACTION_STATUS.PENDING:
      return 'Pending';
    case TRANSACTION_STATUS.CONFIRMED:
      return 'Confirmed';
    case TRANSACTION_STATUS.FAILED:
      return 'Failed';
    case TRANSACTION_STATUS.CANCELLED:
      return 'Cancelled';
    case TRANSACTION_STATUS.VERIFYING:
      return 'Verifying...';
    case TRANSACTION_STATUS.NONE:
    default:
      return 'No Transaction';
  }
};

/**
 * Get operation display text
 * @param {string} operation - Transaction operation
 * @returns {string} - User-friendly operation text
 */
export const getOperationText = (operation) => {
  const opUpper = operation?.toUpperCase();
  
  switch (opUpper) {
    case TRANSACTION_OPERATIONS.CREATE:
      return 'Created';
    case TRANSACTION_OPERATIONS.UPDATE:
      return 'Updated';
    case TRANSACTION_OPERATIONS.DELETE:
      return 'Deleted';
    case TRANSACTION_OPERATIONS.PIN:
      return 'Pinned/Unpinned';
    case TRANSACTION_OPERATIONS.CATEGORY_CHANGE:
      return 'Category Changed';
    default:
      return operation || 'Unknown';
  }
};

/**
 * Check if transaction is in a final state
 * @param {string} status - Transaction status
 * @returns {boolean} - True if status is final (confirmed, failed, cancelled)
 */
export const isFinalStatus = (status) => {
  const statusUpper = status?.toUpperCase();
  return [
    TRANSACTION_STATUS.CONFIRMED,
    TRANSACTION_STATUS.FAILED,
    TRANSACTION_STATUS.CANCELLED,
  ].includes(statusUpper);
};

/**
 * Check if transaction is in a pending state
 * @param {string} status - Transaction status
 * @returns {boolean} - True if status is pending or building
 */
export const isPendingStatus = (status) => {
  const statusUpper = status?.toUpperCase();
  return [
    TRANSACTION_STATUS.BUILDING,
    TRANSACTION_STATUS.PENDING,
    TRANSACTION_STATUS.VERIFYING,
  ].includes(statusUpper);
};

/**
 * Calculate estimated confirmation time remaining
 * @param {Date|string} submittedAt - Transaction submission timestamp
 * @returns {number} - Estimated milliseconds until confirmation (0 if passed)
 */
export const getEstimatedTimeRemaining = (submittedAt) => {
  if (!submittedAt) return BLOCKCHAIN_CONFIG.ESTIMATED_CONFIRMATION_TIME;
  
  const submitted = new Date(submittedAt).getTime();
  const now = Date.now();
  const elapsed = now - submitted;
  const remaining = BLOCKCHAIN_CONFIG.ESTIMATED_CONFIRMATION_TIME - elapsed;
  
  return Math.max(0, remaining);
};

/**
 * Format time remaining to human-readable string
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string (e.g., "2m 30s")
 */
export const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return 'Any moment now...';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `~${minutes}m ${remainingSeconds}s`;
  }
  return `~${remainingSeconds}s`;
};
