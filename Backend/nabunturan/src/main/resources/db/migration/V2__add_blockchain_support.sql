-- ================================================================
-- V2: Add Blockchain Support
-- ================================================================
-- Description: Adds blockchain fields to notes table and creates
--              blockchain_transactions table for transaction tracking
-- Author: BRETT (Backend Developer)
-- Date: 2025-11-17
-- ================================================================

-- ================================================================
-- Part 1: Update Notes Table with Blockchain Fields
-- ================================================================

-- Add blockchain-related columns to notes table
ALTER TABLE notes 
ADD COLUMN created_by_wallet VARCHAR(150) COMMENT 'Cardano wallet address that created the note',
ADD COLUMN on_chain BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether the note is stored on blockchain',
ADD COLUMN latest_tx_hash VARCHAR(64) COMMENT 'Latest blockchain transaction hash for this note';

-- Create indexes for blockchain fields in notes table
CREATE INDEX idx_notes_created_by_wallet ON notes(created_by_wallet);
CREATE INDEX idx_notes_on_chain ON notes(on_chain);
CREATE INDEX idx_notes_latest_tx_hash ON notes(latest_tx_hash);

-- ================================================================
-- Part 2: Create Blockchain Transactions Table
-- ================================================================

-- Create blockchain_transactions table
CREATE TABLE IF NOT EXISTS blockchain_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Transaction identification
    tx_hash VARCHAR(64) NOT NULL UNIQUE COMMENT 'Cardano transaction hash',
    
    -- Block information
    block_height BIGINT NOT NULL COMMENT 'Block number where transaction was confirmed',
    block_time TIMESTAMP NOT NULL COMMENT 'Timestamp when block was created',
    
    -- Transaction type and status
    type VARCHAR(20) NOT NULL COMMENT 'Transaction type: CREATE, UPDATE, DELETE',
    status VARCHAR(20) NOT NULL COMMENT 'Transaction status: PENDING, MEMPOOL, CONFIRMED, FAILED',
    
    -- Metadata and wallet
    metadata TEXT COMMENT 'Full JSON metadata from blockchain transaction',
    wallet_address VARCHAR(150) NOT NULL COMMENT 'Wallet address that initiated the transaction',
    
    -- Link to note (nullable for pending transactions)
    note_id BIGINT COMMENT 'Reference to the note this transaction affects',
    
    -- Tracking information
    indexed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When this transaction was indexed by backend',
    confirmations INT COMMENT 'Number of block confirmations',
    
    -- Foreign key constraint
    CONSTRAINT fk_blockchain_tx_note 
        FOREIGN KEY (note_id) 
        REFERENCES notes(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Check constraints for enum values
    CONSTRAINT chk_transaction_type 
        CHECK (type IN ('CREATE', 'UPDATE', 'DELETE')),
    CONSTRAINT chk_transaction_status 
        CHECK (status IN ('PENDING', 'MEMPOOL', 'CONFIRMED', 'FAILED')),
    
    -- Performance indexes
    INDEX idx_blockchain_tx_hash (tx_hash),
    INDEX idx_blockchain_note_id (note_id),
    INDEX idx_blockchain_wallet_address (wallet_address),
    INDEX idx_blockchain_status (status),
    INDEX idx_blockchain_type (type),
    INDEX idx_blockchain_block_height (block_height DESC),
    INDEX idx_blockchain_block_time (block_time DESC),
    INDEX idx_blockchain_indexed_at (indexed_at DESC),
    
    -- Composite indexes for common queries
    INDEX idx_blockchain_wallet_status (wallet_address, status),
    INDEX idx_blockchain_note_status (note_id, status),
    INDEX idx_blockchain_status_type (status, type)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Part 3: Add Comments for Documentation
-- ================================================================

-- Table comments
ALTER TABLE blockchain_transactions 
COMMENT = 'Stores blockchain transaction records linked to notes for audit trail and synchronization';

-- ================================================================
-- Part 4: Initial Data (Optional)
-- ================================================================

-- No initial data needed for blockchain tables
-- Data will be populated by the BlockchainIndexerService

-- ================================================================
-- End of Migration V2
-- ================================================================

