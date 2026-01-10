package com.web.nrs.utils;

import java.util.function.Supplier;

public class ValidationUtils {
    private ValidationUtils() {}

    public static <T> T throwIfNull(
            T value,
            Supplier<? extends RuntimeException> exceptionSupplier
    ) {
        if (value == null) {
            throw exceptionSupplier.get();
        }
        return value;
    }
}
