package com.notesapp.nabunturan.Entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Entity class representing a blockchain transaction
 * that is linked to a note operation (create, update, or delete)
 */
@Entity
@Table(name = "blockchain_transactions")
public class BlockchainTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Transaction hash cannot be null")
    @Size(max = 64, message = "Transaction hash must not exceed 64 characters")
    @Column(nullable = false, unique = true, length = 64)
    private String txHash;

    @NotNull(message = "Block height cannot be null")
    @Column(nullable = false)
    private Long blockHeight;

    @NotNull(message = "Block time cannot be null")
    @Column(nullable = false)
    private LocalDateTime blockTime;

    @NotNull(message = "Transaction type cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @NotNull(message = "Transaction status cannot be null")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    @NotNull(message = "Wallet address cannot be null")
    @Size(max = 150, message = "Wallet address must not exceed 150 characters")
    @Column(nullable = false, length = 150)
    private String walletAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;

    @CreationTimestamp
    @Column(name = "indexed_at", nullable = false, updatable = false)
    private LocalDateTime indexedAt;

    @Column
    private Integer confirmations;

    // Default constructor
    public BlockchainTransaction() {
    }

    // Constructor with essential fields
    public BlockchainTransaction(String txHash, Long blockHeight, LocalDateTime blockTime,
                                  TransactionType type, TransactionStatus status, String walletAddress) {
        this.txHash = txHash;
        this.blockHeight = blockHeight;
        this.blockTime = blockTime;
        this.type = type;
        this.status = status;
        this.walletAddress = walletAddress;
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTxHash() {
        return txHash;
    }

    public void setTxHash(String txHash) {
        this.txHash = txHash;
    }

    public Long getBlockHeight() {
        return blockHeight;
    }

    public void setBlockHeight(Long blockHeight) {
        this.blockHeight = blockHeight;
    }

    public LocalDateTime getBlockTime() {
        return blockTime;
    }

    public void setBlockTime(LocalDateTime blockTime) {
        this.blockTime = blockTime;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public void setStatus(TransactionStatus status) {
        this.status = status;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public Note getNote() {
        return note;
    }

    public void setNote(Note note) {
        this.note = note;
    }

    public LocalDateTime getIndexedAt() {
        return indexedAt;
    }

    public void setIndexedAt(LocalDateTime indexedAt) {
        this.indexedAt = indexedAt;
    }

    public Integer getConfirmations() {
        return confirmations;
    }

    public void setConfirmations(Integer confirmations) {
        this.confirmations = confirmations;
    }

    @Override
    public String toString() {
        return "BlockchainTransaction{" +
                "id=" + id +
                ", txHash='" + txHash + '\'' +
                ", blockHeight=" + blockHeight +
                ", blockTime=" + blockTime +
                ", type=" + type +
                ", status=" + status +
                ", walletAddress='" + walletAddress + '\'' +
                ", confirmations=" + confirmations +
                ", indexedAt=" + indexedAt +
                '}';
    }
}

