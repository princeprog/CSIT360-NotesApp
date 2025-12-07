package com.notesapp.nabunturan.DTO;

import com.notesapp.nabunturan.Validator.ValidCardanoAddress;
import com.notesapp.nabunturan.Validator.ValidTransactionHash;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateNoteWithTxRequest {

    // Note ID is set from path variable, not from request body
    private Long noteId;

    @Size(min = 1, max = 255, message = "Title must be between 1 and 255 characters")
    private String title;

    @Size(max = 10000, message = "Content must not exceed 10000 characters")
    private String content;

    private Boolean isPinned;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    @NotNull(message = "Transaction hash is required")
    @ValidTransactionHash
    private String txHash;

    @NotNull(message = "Wallet address is required")
    @ValidCardanoAddress
    private String walletAddress;

    @Size(max = 5000, message = "Metadata JSON must not exceed 5000 characters")
    private String metadataJson;

    public UpdateNoteWithTxRequest() {}

    public UpdateNoteWithTxRequest(Long noteId, String txHash, String walletAddress) {
        this.noteId = noteId;
        this.txHash = txHash;
        this.walletAddress = walletAddress;
    }

    // Getters and Setters

    public Long getNoteId() {
        return noteId;
    }

    public void setNoteId(Long noteId) {
        this.noteId = noteId;
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

    public Boolean getIsPinned() {
        return isPinned;
    }

    public void setIsPinned(Boolean isPinned) {
        this.isPinned = isPinned;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public String getMetadataJson() {
        return metadataJson;
    }

    public void setMetadataJson(String metadataJson) {
        this.metadataJson = metadataJson;
    }
}
