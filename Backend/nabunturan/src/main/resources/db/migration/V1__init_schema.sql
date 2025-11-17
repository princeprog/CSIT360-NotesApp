-- ================================================================
-- V1: Initial Schema - Notes Table
-- ================================================================
-- Description: Creates the initial notes table with basic fields
-- Author: BRETT (Backend Developer)
-- Date: 2025-11-17
-- ================================================================

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_notes_created_at (created_at DESC),
    INDEX idx_notes_updated_at (updated_at DESC),
    INDEX idx_notes_category (category),
    INDEX idx_notes_is_pinned (is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

