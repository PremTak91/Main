package com.web.nrs.utils;

import java.time.LocalDate;

public class NrsUtils {
    public static String getFinancialYear() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();

        if (today.getMonthValue() >= 4) {
            return String.valueOf(year).substring(2) +
                    String.valueOf(year + 1).substring(2);
        } else {
            return String.valueOf(year - 1).substring(2) +
                    String.valueOf(year).substring(2);
        }
    }
}
