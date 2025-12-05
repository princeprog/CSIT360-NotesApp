package com.notesapp.nabunturan.DTO;

import com.notesapp.nabunturan.Validator.ValidCardanoAddress;
import com.notesapp.nabunturan.Validator.ValidTransactionHash;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class DeleteNoteWithTxRequest {

    @NotNull(message = "Note ID is required")
    private Long noteId;

    @NotNull(message = "Transaction hash is required")
    @ValidTransactionHash
    private String txHash;

    @NotNull(message = "Wallet address is required")
    @ValidCardanoAddress
    private String walletAddress;

    @Size(max = 5000, message = "Metadata JSON must not exceed 5000 characters")
    private String metadataJson;

    public DeleteNoteWithTxRequest() {}

    public DeleteNoteWithTxRequest(Long noteId, String txHash, String walletAddress) {
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
