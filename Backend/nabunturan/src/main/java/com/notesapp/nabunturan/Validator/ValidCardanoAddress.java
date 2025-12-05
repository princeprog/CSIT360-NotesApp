package com.notesapp.nabunturan.Validator;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Annotation for validating Cardano addresses in Bech32 format
 */
@Documented
@Constraint(validatedBy = CardanoAddressValidator.class)
@Target({ ElementType.METHOD, ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCardanoAddress {
    
    String message() default "Invalid Cardano address format";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
