package com.notesapp.nabunturan.Validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator for Cardano transaction hashes
 * Transaction hashes are 64 hexadecimal characters (32 bytes in hex format)
 */
public class TransactionHashValidator implements ConstraintValidator<ValidTransactionHash, String> {

    private static final int TRANSACTION_HASH_LENGTH = 64;
    private static final String HEX_PATTERN = "^[a-fA-F0-9]+$";

    @Override
    public void initialize(ValidTransactionHash constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String txHash, ConstraintValidatorContext context) {
        // Null or empty transaction hashes should be handled by @NotNull or @NotEmpty
        if (txHash == null || txHash.isEmpty()) {
            return true;
        }

        // Check length - must be exactly 64 characters
        if (txHash.length() != TRANSACTION_HASH_LENGTH) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Transaction hash must be exactly " + TRANSACTION_HASH_LENGTH + " characters long"
            ).addConstraintViolation();
            return false;
        }

        // Check if it contains only hexadecimal characters (0-9, a-f, A-F)
        if (!txHash.matches(HEX_PATTERN)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Transaction hash must contain only hexadecimal characters (0-9, a-f, A-F)"
            ).addConstraintViolation();
            return false;
        }

        return true;
    }

    /**
     * Static utility method to validate transaction hash format
     * @param txHash The transaction hash to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidFormat(String txHash) {
        if (txHash == null || txHash.isEmpty()) {
            return false;
        }

        return txHash.length() == TRANSACTION_HASH_LENGTH && txHash.matches(HEX_PATTERN);
    }

    /**
     * Normalize transaction hash to lowercase
     * @param txHash The transaction hash
     * @return Normalized transaction hash in lowercase
     */
    public static String normalize(String txHash) {
        if (txHash == null) {
            return null;
        }
        return txHash.toLowerCase();
    }
}
