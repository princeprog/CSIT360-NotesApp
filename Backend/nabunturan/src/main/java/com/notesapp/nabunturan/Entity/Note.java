package com.notesapp.nabunturan.Entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean isPinned;

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

    @OneToMany(mappedBy = "note", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<BlockchainTransaction> blockchainTransactions = new ArrayList<>();

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

    public List<BlockchainTransaction> getBlockchainTransactions() {
        return blockchainTransactions;
    }

    public void setBlockchainTransactions(List<BlockchainTransaction> blockchainTransactions) {
        this.blockchainTransactions = blockchainTransactions;
    }

    // Helper method to add a blockchain transaction
    public void addBlockchainTransaction(BlockchainTransaction transaction) {
        blockchainTransactions.add(transaction);
        transaction.setNote(this);
    }

    // Helper method to remove a blockchain transaction
    public void removeBlockchainTransaction(BlockchainTransaction transaction) {
        blockchainTransactions.remove(transaction);
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
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}

