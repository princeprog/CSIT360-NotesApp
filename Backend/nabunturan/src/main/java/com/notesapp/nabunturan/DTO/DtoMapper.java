package com.notesapp.nabunturan.DTO;

import com.notesapp.nabunturan.Entity.BlockchainTransaction;
import com.notesapp.nabunturan.Entity.Note;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Utility class for mapping entities to DTOs and vice versa.
 * Provides conversion methods between domain entities and data transfer objects.
 * 
 * According to backend rules:
 * - DTOs used for data transfer between layers
 * - Entities used only for database operations
 * - This mapper facilitates clean separation
 */
public class DtoMapper {

    private DtoMapper() {
        // Private constructor to prevent instantiation
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    // ========== NOTE MAPPINGS ==========

    /**
     * Convert Note entity to NoteDto
     * 
     * @param note Note entity
     * @return NoteDto
     */
    public static NoteDto toNoteDto(Note note) {
        if (note == null) {
            return null;
        }
        return new NoteDto(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                note.getCategory(),
                note.isPinned(),
                note.getOnChain() != null ? note.getOnChain() : false,
                note.getCreatedByWallet(),
                note.getLatestTxHash(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    /**
     * Convert Note entity to NoteMetadataDto (without content)
     * 
     * @param note Note entity
     * @return NoteMetadataDto
     */
    public static NoteMetadataDto toNoteMetadataDto(Note note) {
        if (note == null) {
            return null;
        }

        int transactionCount = note.getBlockchainTransactions() != null 
                ? note.getBlockchainTransactions().size() 
                : 0;

        int confirmedCount = note.getBlockchainTransactions() != null
                ? (int) note.getBlockchainTransactions().stream()
                        .filter(tx -> tx.getStatus() != null && tx.getStatus().name().equals("CONFIRMED"))
                        .count()
                : 0;

        return new NoteMetadataDto(
                note.getId(),
                note.getTitle(),
                note.getCategory(),
                note.isPinned(),
                note.getOnChain() != null ? note.getOnChain() : false,
                note.getCreatedByWallet(),
                note.getLatestTxHash(),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                transactionCount,
                confirmedCount
        );
    }

    /**
     * Convert Note entity to BlockchainNoteDto (with full transaction history)
     * 
     * @param note Note entity with blockchain transactions loaded
     * @return BlockchainNoteDto
     */
    public static BlockchainNoteDto toBlockchainNoteDto(Note note) {
        if (note == null) {
            return null;
        }

        List<BlockchainTransactionDto> transactions = note.getBlockchainTransactions() != null
                ? note.getBlockchainTransactions().stream()
                        .map(DtoMapper::toBlockchainTransactionDto)
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return new BlockchainNoteDto(
                note.getId(),
                note.getTitle(),
                note.getContent(),
                note.getCategory(),
                note.isPinned(),
                note.getOnChain() != null ? note.getOnChain() : false,
                note.getCreatedByWallet(),
                note.getLatestTxHash(),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                transactions
        );
    }

    /**
     * Update Note entity from NoteDto (for update operations)
     * Does not update id, createdAt, or blockchain fields
     * 
     * @param note Note entity to update
     * @param dto NoteDto with new values
     */
    public static void updateNoteFromDto(Note note, NoteDto dto) {
        if (note == null || dto == null) {
            throw new IllegalArgumentException("Note and DTO cannot be null");
        }

        note.setTitle(dto.title());
        note.setContent(dto.content());
        note.setCategory(dto.category());
        note.setPinned(dto.isPinned());
        // Note: onChain, createdByWallet, and latestTxHash are managed by blockchain operations
    }

    /**
     * Create new Note entity from NoteDto (for create operations)
     * 
     * @param dto NoteDto
     * @return new Note entity
     */
    public static Note toNoteEntity(NoteDto dto) {
        if (dto == null) {
            return null;
        }

        Note note = new Note();
        note.setTitle(dto.title());
        note.setContent(dto.content());
        note.setCategory(dto.category());
        note.setPinned(dto.isPinned());
        note.setOnChain(dto.onChain());
        note.setCreatedByWallet(dto.createdByWallet());
        note.setLatestTxHash(dto.latestTxHash());

        return note;
    }

    // ========== BLOCKCHAIN TRANSACTION MAPPINGS ==========

    /**
     * Convert BlockchainTransaction entity to BlockchainTransactionDto
     * 
     * @param transaction BlockchainTransaction entity
     * @return BlockchainTransactionDto
     */
    public static BlockchainTransactionDto toBlockchainTransactionDto(BlockchainTransaction transaction) {
        if (transaction == null) {
            return null;
        }

        Long noteId = transaction.getNote() != null ? transaction.getNote().getId() : null;
        String noteTitle = transaction.getNote() != null ? transaction.getNote().getTitle() : null;

        return new BlockchainTransactionDto(
                transaction.getId(),
                transaction.getTxHash(),
                transaction.getBlockHeight(),
                transaction.getBlockTime(),
                transaction.getType(),
                transaction.getStatus(),
                transaction.getMetadata(),
                transaction.getWalletAddress(),
                noteId,
                noteTitle,
                transaction.getIndexedAt(),
                transaction.getConfirmations()
        );
    }

    /**
     * Create new BlockchainTransaction entity from BlockchainTransactionDto
     * Note: Does not set the Note relationship (must be done separately)
     * 
     * @param dto BlockchainTransactionDto
     * @return new BlockchainTransaction entity
     */
    public static BlockchainTransaction toBlockchainTransactionEntity(BlockchainTransactionDto dto) {
        if (dto == null) {
            return null;
        }

        BlockchainTransaction transaction = new BlockchainTransaction();
        transaction.setTxHash(dto.txHash());
        transaction.setBlockHeight(dto.blockHeight());
        transaction.setBlockTime(dto.blockTime());
        transaction.setType(dto.type());
        transaction.setStatus(dto.status());
        transaction.setMetadata(dto.metadata());
        transaction.setWalletAddress(dto.walletAddress());
        transaction.setConfirmations(dto.confirmations());
        // Note: Note relationship must be set by caller

        return transaction;
    }

    // ========== LIST MAPPINGS ==========

    /**
     * Convert list of Note entities to list of NoteDtos
     * 
     * @param notes List of Note entities
     * @return List of NoteDtos
     */
    public static List<NoteDto> toNoteDtoList(List<Note> notes) {
        if (notes == null) {
            return new ArrayList<>();
        }
        return notes.stream()
                .map(DtoMapper::toNoteDto)
                .collect(Collectors.toList());
    }

    /**
     * Convert list of Note entities to list of NoteMetadataDtos
     * 
     * @param notes List of Note entities
     * @return List of NoteMetadataDtos
     */
    public static List<NoteMetadataDto> toNoteMetadataDtoList(List<Note> notes) {
        if (notes == null) {
            return new ArrayList<>();
        }
        return notes.stream()
                .map(DtoMapper::toNoteMetadataDto)
                .collect(Collectors.toList());
    }

    /**
     * Convert list of Note entities to list of BlockchainNoteDtos
     * 
     * @param notes List of Note entities with transactions loaded
     * @return List of BlockchainNoteDtos
     */
    public static List<BlockchainNoteDto> toBlockchainNoteDtoList(List<Note> notes) {
        if (notes == null) {
            return new ArrayList<>();
        }
        return notes.stream()
                .map(DtoMapper::toBlockchainNoteDto)
                .collect(Collectors.toList());
    }

    /**
     * Convert list of BlockchainTransaction entities to list of BlockchainTransactionDtos
     * 
     * @param transactions List of BlockchainTransaction entities
     * @return List of BlockchainTransactionDtos
     */
    public static List<BlockchainTransactionDto> toBlockchainTransactionDtoList(List<BlockchainTransaction> transactions) {
        if (transactions == null) {
            return new ArrayList<>();
        }
        return transactions.stream()
                .map(DtoMapper::toBlockchainTransactionDto)
                .collect(Collectors.toList());
    }
}

