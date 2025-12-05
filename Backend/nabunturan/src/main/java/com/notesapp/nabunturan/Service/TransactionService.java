package com.notesapp.nabunturan.Service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.notesapp.nabunturan.Entity.Note;
import com.notesapp.nabunturan.Entity.Transaction;
import com.notesapp.nabunturan.Repository.NoteRepository;
import com.notesapp.nabunturan.Repository.TransactionRepository;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private NoteRepository noteRepository;

    /**
     * Create a new transaction for a note
     * @param noteId The ID of the note
     * @param txHash The transaction hash
     * @param walletAddress The wallet address
     * @param metadataJson The metadata in JSON format
     * @return The created transaction
     */
    @Transactional
    public Transaction createTransaction(Long noteId, String txHash, String walletAddress, String metadataJson) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found with id: " + noteId));

        Transaction transaction = new Transaction();
        transaction.setNote(note);
        transaction.setTxHash(txHash);
        transaction.setStatus("PENDING");
        transaction.setWalletAddress(walletAddress);
        transaction.setMetadataJson(metadataJson);
        transaction.setRetryCount(0);
        transaction.setLastCheckedAt(LocalDateTime.now());

        Transaction savedTransaction = transactionRepository.save(transaction);
        
        // Update note's transaction hash
        note.setTxHash(txHash);
        note.setWalletAddress(walletAddress);
        note.setLastUpdatedTxHash(txHash);
        noteRepository.save(note);

        return savedTransaction;
    }

    /**
     * Update the status of a transaction
     * @param txHash The transaction hash
     * @param status The new status
     * @param blockHeight The block height (optional)
     * @param blockTime The block time (optional)
     * @return The updated transaction
     */
    @Transactional
    public Transaction updateTransactionStatus(String txHash, String status, Long blockHeight, LocalDateTime blockTime) {
        Transaction transaction = transactionRepository.findByTxHash(txHash)
                .orElseThrow(() -> new RuntimeException("Transaction not found with hash: " + txHash));

        transaction.setStatus(status);
        transaction.setLastCheckedAt(LocalDateTime.now());

        if (blockHeight != null) {
            transaction.setBlockHeight(blockHeight);
        }

        if (blockTime != null) {
            transaction.setBlockTime(blockTime);
        }

        // If status is CONFIRMED, set confirmed timestamp
        if ("CONFIRMED".equalsIgnoreCase(status)) {
            transaction.setConfirmedAt(LocalDateTime.now());
            
            // Update the associated note status
            Note note = transaction.getNote();
            if (note != null) {
                note.setStatus("CONFIRMED");
                note.setOnChain(true);
                noteRepository.save(note);
            }
        }

        return transactionRepository.save(transaction);
    }

    /**
     * Get a transaction by its hash
     * @param txHash The transaction hash
     * @return The transaction
     */
    public Transaction getTransactionByHash(String txHash) {
        return transactionRepository.findByTxHash(txHash)
                .orElseThrow(() -> new RuntimeException("Transaction not found with hash: " + txHash));
    }

    /**
     * Get all transactions for a specific note
     * @param noteId The note ID
     * @return List of transactions
     */
    public List<Transaction> getTransactionsByNoteId(Long noteId) {
        return transactionRepository.findByNoteId(noteId);
    }

    /**
     * Get transactions for a wallet address with pagination (deprecated - use Pageable version)
     * @param walletAddress The wallet address
     * @param page The page number (0-indexed)
     * @param size The page size
     * @return Page of transactions
     * @deprecated Use getTransactionsByWalletAddress(String, Pageable) instead
     */
    @Deprecated
    public Page<Transaction> getTransactionsByWalletAddress(String walletAddress, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return transactionRepository.findByWalletAddressOrderByCreatedAtDesc(walletAddress, pageable);
    }

    /**
     * Get all pending transactions
     * @return List of pending transactions
     */
    public List<Transaction> getPendingTransactions() {
        return transactionRepository.findPendingTransactions();
    }

    /**
     * Mark a transaction as failed with an error message
     * @param txHash The transaction hash
     * @param errorMessage The error message
     * @return The updated transaction
     */
    @Transactional
    public Transaction markTransactionAsFailed(String txHash, String errorMessage) {
        Transaction transaction = transactionRepository.findByTxHash(txHash)
                .orElseThrow(() -> new RuntimeException("Transaction not found with hash: " + txHash));

        transaction.setStatus("FAILED");
        transaction.setErrorMessage(errorMessage);
        transaction.setLastCheckedAt(LocalDateTime.now());

        // Update the associated note status
        Note note = transaction.getNote();
        if (note != null) {
            note.setStatus("FAILED");
            noteRepository.save(note);
        }

        return transactionRepository.save(transaction);
    }

    /**
     * Retry a failed transaction
     * @param txHash The transaction hash
     * @return The updated transaction
     */
    @Transactional
    public Transaction retryTransaction(String txHash) {
        Transaction transaction = transactionRepository.findByTxHash(txHash)
                .orElseThrow(() -> new RuntimeException("Transaction not found with hash: " + txHash));

        // Only retry if transaction is in FAILED state
        if (!"FAILED".equalsIgnoreCase(transaction.getStatus())) {
            throw new RuntimeException("Can only retry failed transactions. Current status: " + transaction.getStatus());
        }

        transaction.setStatus("PENDING");
        transaction.setRetryCount(transaction.getRetryCount() + 1);
        transaction.setErrorMessage(null);
        transaction.setLastCheckedAt(LocalDateTime.now());

        // Update the associated note status
        Note note = transaction.getNote();
        if (note != null) {
            note.setStatus("PENDING");
            noteRepository.save(note);
        }

        return transactionRepository.save(transaction);
    }

    /**
     * Get transaction by transaction hash
     * @param txHash The transaction hash
     * @return The transaction
     */
    public Transaction getTransactionByTxHash(String txHash) {
        return transactionRepository.findByTxHash(txHash)
                .orElseThrow(() -> new RuntimeException("Transaction not found with hash: " + txHash));
    }

    /**
     * Get all transactions
     * @return List of all transactions
     */
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    /**
     * Get transactions by status
     * @param status The transaction status
     * @return List of transactions with the given status
     */
    public List<Transaction> getTransactionsByStatus(String status) {
        return transactionRepository.findByStatus(status);
    }

    /**
     * Get transactions by wallet address (non-paginated)
     * @param walletAddress The wallet address
     * @return List of transactions
     */
    public List<Transaction> getTransactionsByWalletAddress(String walletAddress) {
        return transactionRepository.findByWalletAddress(walletAddress);
    }

    /**
     * Get transactions by wallet address with pagination
     * @param walletAddress The wallet address
     * @param pageable The pageable object
     * @return Page of transactions
     */
    public Page<Transaction> getTransactionsByWalletAddress(String walletAddress, Pageable pageable) {
        return transactionRepository.findByWalletAddressOrderByCreatedAtDesc(walletAddress, pageable);
    }

    /**
     * Get transactions by status and wallet address
     * @param status The transaction status
     * @param walletAddress The wallet address
     * @return List of transactions
     */
    public List<Transaction> getTransactionsByStatusAndWalletAddress(String status, String walletAddress) {
        List<Transaction> allTransactions = transactionRepository.findByWalletAddress(walletAddress);
        return allTransactions.stream()
                .filter(tx -> status.equalsIgnoreCase(tx.getStatus()))
                .toList();
    }
}
