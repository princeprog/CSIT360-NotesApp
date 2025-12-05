package com.notesapp.nabunturan.DTO;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Entity.Transaction;

/**
 * Response DTO for Note with transaction status information
 */
public class NoteWithStatusResponse {

    private Long id;
    private String title;
    private String content;
    private boolean isPinned;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdByWallet;
    private Boolean onChain;
    private String latestTxHash;
    
    // Transaction status fields
    private String status;
    private String txHash;
    private String walletAddress;
    private String lastUpdatedTxHash;
    
    // Transaction info
    private Integer totalTransactions;
    private Integer pendingTransactions;
    private Integer confirmedTransactions;
    private Integer failedTransactions;
    private LocalDateTime lastTransactionAt;
    private String lastTransactionStatus;

    public NoteWithStatusResponse() {}

    /**
     * Create response from Note entity
     * @param note Note entity
     * @return NoteWithStatusResponse
     */
    public static NoteWithStatusResponse fromEntity(Note note) {
        NoteWithStatusResponse response = new NoteWithStatusResponse();
        
        response.setId(note.getId());
        response.setTitle(note.getTitle());
        response.setContent(note.getContent());
        response.setPinned(note.isPinned());
        response.setCategory(note.getCategory());
        response.setCreatedAt(note.getCreatedAt());
        response.setUpdatedAt(note.getUpdatedAt());
        response.setCreatedByWallet(note.getCreatedByWallet());
        response.setOnChain(note.getOnChain());
        response.setLatestTxHash(note.getLatestTxHash());
        response.setStatus(note.getStatus());
        response.setTxHash(note.getTxHash());
        response.setWalletAddress(note.getWalletAddress());
        response.setLastUpdatedTxHash(note.getLastUpdatedTxHash());
        
        // Calculate transaction statistics
        List<Transaction> transactions = note.getTransactions();
        if (transactions != null && !transactions.isEmpty()) {
            response.setTotalTransactions(transactions.size());
            
            long pending = transactions.stream()
                .filter(tx -> "PENDING".equalsIgnoreCase(tx.getStatus()))
                .count();
            response.setPendingTransactions((int) pending);
            
            long confirmed = transactions.stream()
                .filter(tx -> "CONFIRMED".equalsIgnoreCase(tx.getStatus()))
                .count();
            response.setConfirmedTransactions((int) confirmed);
            
            long failed = transactions.stream()
                .filter(tx -> "FAILED".equalsIgnoreCase(tx.getStatus()))
                .count();
            response.setFailedTransactions((int) failed);
            
            // Get last transaction info
            Transaction lastTx = transactions.get(transactions.size() - 1);
            response.setLastTransactionAt(lastTx.getCreatedAt());
            response.setLastTransactionStatus(lastTx.getStatus());
        } else {
            response.setTotalTransactions(0);
            response.setPendingTransactions(0);
            response.setConfirmedTransactions(0);
            response.setFailedTransactions(0);
        }
        
        return response;
    }

    /**
     * Create response list from Note entities
     * @param notes List of Note entities
     * @return List of NoteWithStatusResponse
     */
    public static List<NoteWithStatusResponse> fromEntities(List<Note> notes) {
        List<NoteWithStatusResponse> responses = new ArrayList<>();
        for (Note note : notes) {
            responses.add(fromEntity(note));
        }
        return responses;
    }

    // Getters and Setters

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
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

    public Integer getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(Integer totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public Integer getPendingTransactions() {
        return pendingTransactions;
    }

    public void setPendingTransactions(Integer pendingTransactions) {
        this.pendingTransactions = pendingTransactions;
    }

    public Integer getConfirmedTransactions() {
        return confirmedTransactions;
    }

    public void setConfirmedTransactions(Integer confirmedTransactions) {
        this.confirmedTransactions = confirmedTransactions;
    }

    public Integer getFailedTransactions() {
        return failedTransactions;
    }

    public void setFailedTransactions(Integer failedTransactions) {
        this.failedTransactions = failedTransactions;
    }

    public LocalDateTime getLastTransactionAt() {
        return lastTransactionAt;
    }

    public void setLastTransactionAt(LocalDateTime lastTransactionAt) {
        this.lastTransactionAt = lastTransactionAt;
    }

    public String getLastTransactionStatus() {
        return lastTransactionStatus;
    }

    public void setLastTransactionStatus(String lastTransactionStatus) {
        this.lastTransactionStatus = lastTransactionStatus;
    }
}
