package com.notesapp.nabunturan.Validator;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Annotation for validating Cardano transaction hashes
 * Transaction hashes must be 64 hexadecimal characters
 */
@Documented
@Constraint(validatedBy = TransactionHashValidator.class)
@Target({ ElementType.METHOD, ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTransactionHash {
    
    String message() default "Invalid transaction hash format. Must be 64 hexadecimal characters";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
