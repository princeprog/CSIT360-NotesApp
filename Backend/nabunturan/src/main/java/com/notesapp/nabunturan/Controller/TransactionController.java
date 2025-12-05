package com.notesapp.nabunturan.Controller;

import com.notesapp.nabunturan.DTO.TransactionHistoryResponse;
import com.notesapp.nabunturan.DTO.TransactionStatusResponse;
import com.notesapp.nabunturan.Entity.Transaction;
import com.notesapp.nabunturan.Service.TransactionService;
import com.notesapp.nabunturan.Validator.ValidCardanoAddress;
import com.notesapp.nabunturan.Validator.ValidTransactionHash;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
@Validated
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * GET /api/transactions/{txHash} - Get transaction details by hash
     * @param txHash Transaction hash
     * @return TransactionStatusResponse
     */
    @GetMapping("/{txHash}")
    public ResponseEntity<TransactionStatusResponse> getTransactionByHash(
            @PathVariable @ValidTransactionHash String txHash) {
        Transaction transaction = transactionService.getTransactionByTxHash(txHash);
        TransactionStatusResponse response = TransactionStatusResponse.fromEntity(transaction);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * GET /api/transactions/note/{noteId} - Get all transactions for a note
     * @param noteId Note ID
     * @return List<TransactionHistoryResponse>
     */
    @GetMapping("/note/{noteId}")
    public ResponseEntity<List<TransactionHistoryResponse>> getTransactionsByNoteId(@PathVariable Long noteId) {
        List<Transaction> transactions = transactionService.getTransactionsByNoteId(noteId);
        List<TransactionHistoryResponse> responses = TransactionHistoryResponse.fromEntities(transactions);
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    /**
     * GET /api/transactions/wallet/{walletAddress} - Get paginated transactions for a wallet
     * @param walletAddress Wallet address
     * @param page Page number (default: 0)
     * @param size Page size (default: 20)
     * @return Page<TransactionHistoryResponse>
     */
    @GetMapping("/wallet/{walletAddress}")
    public ResponseEntity<Page<TransactionHistoryResponse>> getTransactionsByWallet(
            @PathVariable @ValidCardanoAddress String walletAddress,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<Transaction> transactionPage = transactionService.getTransactionsByWalletAddress(walletAddress, pageable);
        Page<TransactionHistoryResponse> responsePage = transactionPage.map(TransactionHistoryResponse::fromEntity);
        
        return new ResponseEntity<>(responsePage, HttpStatus.OK);
    }

    /**
     * POST /api/transactions/{txHash}/retry - Retry a failed transaction
     * @param txHash Transaction hash
     * @return TransactionStatusResponse
     */
    @PostMapping("/{txHash}/retry")
    public ResponseEntity<TransactionStatusResponse> retryTransaction(
            @PathVariable @ValidTransactionHash String txHash) {
        Transaction transaction = transactionService.retryTransaction(txHash);
        TransactionStatusResponse response = TransactionStatusResponse.fromEntity(transaction);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * GET /api/transactions/pending/count - Get count of pending transactions
     * @param walletAddress Optional wallet address filter
     * @return {"count": number}
     */
    @GetMapping("/pending/count")
    public ResponseEntity<Map<String, Long>> getPendingTransactionsCount(
            @RequestParam(required = false) String walletAddress) {
        
        List<Transaction> pendingTransactions;
        
        if (walletAddress != null && !walletAddress.isEmpty()) {
            pendingTransactions = transactionService.getTransactionsByStatusAndWalletAddress("PENDING", walletAddress);
        } else {
            pendingTransactions = transactionService.getTransactionsByStatus("PENDING");
        }
        
        Map<String, Long> response = new HashMap<>();
        response.put("count", (long) pendingTransactions.size());
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * GET /api/transactions/stats - Get transaction statistics
     * @param walletAddress Optional wallet address filter
     * @return {"total", "pending", "confirmed", "failed"}
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getTransactionStats(
            @RequestParam(required = false) String walletAddress) {
        
        List<Transaction> allTransactions;
        
        if (walletAddress != null && !walletAddress.isEmpty()) {
            allTransactions = transactionService.getTransactionsByWalletAddress(walletAddress);
        } else {
            allTransactions = transactionService.getAllTransactions();
        }
        
        long total = allTransactions.size();
        long pending = allTransactions.stream()
                .filter(tx -> "PENDING".equalsIgnoreCase(tx.getStatus()))
                .count();
        long confirmed = allTransactions.stream()
                .filter(tx -> "CONFIRMED".equalsIgnoreCase(tx.getStatus()))
                .count();
        long failed = allTransactions.stream()
                .filter(tx -> "FAILED".equalsIgnoreCase(tx.getStatus()))
                .count();
        
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("confirmed", confirmed);
        stats.put("failed", failed);
        
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }
}
