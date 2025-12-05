package com.notesapp.nabunturan.Validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validator for Cardano addresses (Bech32 format)
 * TESTNET ONLY - Only accepts testnet addresses (addr_test1)
 */
public class CardanoAddressValidator implements ConstraintValidator<ValidCardanoAddress, String> {

    private static final String TESTNET_PREFIX = "addr_test1";
    private static final int MIN_ADDRESS_LENGTH = 58;
    private static final int MAX_ADDRESS_LENGTH = 150;

    @Override
    public void initialize(ValidCardanoAddress constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String address, ConstraintValidatorContext context) {
        // Null or empty addresses should be handled by @NotNull or @NotEmpty
        if (address == null || address.isEmpty()) {
            return true;
        }

        // Check length
        if (address.length() < MIN_ADDRESS_LENGTH || address.length() > MAX_ADDRESS_LENGTH) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Cardano address must be between " + MIN_ADDRESS_LENGTH + " and " + MAX_ADDRESS_LENGTH + " characters"
            ).addConstraintViolation();
            return false;
        }

        // Check if it starts with valid prefix (testnet only)
        if (!address.startsWith(TESTNET_PREFIX)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Only testnet Cardano addresses are allowed. Address must start with 'addr_test1'"
            ).addConstraintViolation();
            return false;
        }

        // Check if it contains only valid Bech32 characters
        // Bech32 format: addr_test1 followed by valid bech32 characters
        // Valid bech32 charset: qpzry9x8gf2tvdw0s3jn54khce6mua7l (plus underscore for prefix)
        String bech32Pattern = "^[a-z0-9_]+$";
        if (!address.matches(bech32Pattern)) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Cardano address contains invalid characters. Must be lowercase alphanumeric (Bech32 format)"
            ).addConstraintViolation();
            return false;
        }

        return true;
    }

    /**
     * Additional validation method for strict Bech32 format checking (testnet only)
     * Can be used for more detailed validation if needed
     */
    public static boolean isValidBech32Format(String address) {
        if (address == null || address.isEmpty()) {
            return false;
        }

        // Split by '1' separator (Bech32 uses '1' to separate human-readable part from data)
        String[] parts = address.split("1", 2);
        if (parts.length != 2) {
            return false;
        }

        String hrp = parts[0]; // Human-readable part (addr_test for testnet)
        String data = parts[1]; // Data part

        // Validate human-readable part - testnet only
        if (!hrp.equals("addr_test")) {
            return false;
        }

        // Validate data part contains only valid Bech32 characters
        // Valid charset: qpzry9x8gf2tvdw0s3jn54khce6mua7l
        String bech32Charset = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
        for (char c : data.toCharArray()) {
            if (bech32Charset.indexOf(c) == -1) {
                return false;
            }
        }

        return true;
    }
}
