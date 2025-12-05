package com.notesapp.nabunturan.Entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "notes", indexes = {
    @Index(name = "idx_notes_status", columnList = "status"),
    @Index(name = "idx_notes_tx_hash", columnList = "tx_hash"),
    @Index(name = "idx_notes_wallet_address", columnList = "wallet_address"),
    @Index(name = "idx_notes_created_at", columnList = "created_at")
})
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    @Column(nullable = false, length = 255)
    private String title;

    @Size(max = 10000, message = "Content must not exceed 10000 characters")
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean isPinned;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    @Column(length = 100)
    private String category;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by_wallet", length = 150)
    private String createdByWallet;

    @Column(name = "on_chain", nullable = false)
    private Boolean onChain = false;

    @Column(name = "latest_tx_hash", length = 64)
    private String latestTxHash;

    @Column(length = 50)
    private String status;

    @Column(name = "tx_hash", length = 64)
    private String txHash;

    @Column(name = "wallet_address", length = 150)
    private String walletAddress;

    @Column(name = "last_updated_tx_hash", length = 64)
    private String lastUpdatedTxHash;

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Transaction> transactions = new ArrayList<>();

    public Note() {}

    public Note(String title, String content, boolean isPinned, String category) {
        this.title = title;
        this.content = content;
        this.isPinned = isPinned;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean isPinned() {
        return isPinned;
    }

    public void setPinned(boolean pinned) {
        isPinned = pinned;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedByWallet() {
        return createdByWallet;
    }

    public void setCreatedByWallet(String createdByWallet) {
        this.createdByWallet = createdByWallet;
    }

    public Boolean getOnChain() {
        return onChain;
    }

    public void setOnChain(Boolean onChain) {
        this.onChain = onChain;
    }

    public String getLatestTxHash() {
        return latestTxHash;
    }

    public void setLatestTxHash(String latestTxHash) {
        this.latestTxHash = latestTxHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTxHash() {
        return txHash;
    }

    public void setTxHash(String txHash) {
        this.txHash = txHash;
    }

    public String getWalletAddress() {
        return walletAddress;
    }

    public void setWalletAddress(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public String getLastUpdatedTxHash() {
        return lastUpdatedTxHash;
    }

    public void setLastUpdatedTxHash(String lastUpdatedTxHash) {
        this.lastUpdatedTxHash = lastUpdatedTxHash;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }

    // Helper methods for managing bidirectional relationship
    public void addTransaction(Transaction transaction) {
        transactions.add(transaction);
        transaction.setNote(this);
    }

    public void removeTransaction(Transaction transaction) {
        transactions.remove(transaction);
        transaction.setNote(null);
    }

    @Override
    public String toString() {
        return "Note{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", category='" + category + '\'' +
                ", onChain=" + onChain +
                ", createdByWallet='" + createdByWallet + '\'' +
                ", latestTxHash='" + latestTxHash + '\'' +
                ", status='" + status + '\'' +
                ", txHash='" + txHash + '\'' +
                ", walletAddress='" + walletAddress + '\'' +
                ", lastUpdatedTxHash='" + lastUpdatedTxHash + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}

