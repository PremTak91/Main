package com.web.nrs.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SolarQuotation {
    private double kw;
    private int panelWatt;
    private String solarType;
    private String panelsName;
    private double rateKw;
    private double value;
    private String discomMeter;
    private double pqHsCost;
    private double actualPrice;
    private double subsidy;
    private double effectivePrice;
    private String submittedBy;
    private String submittedNumber;
    private String quationNumber;
    private long discountAmount;
    private String customerMobileNumber;
    private String customerName;
    private String pdfType; // New parameter to determine 'Standardized' vs 'Single Page'

    // --- Brochure display fields (not persisted, populated at PDF generation time) ---
    /** Display date e.g. "04 April 2026" */
    private String quotationDate;
    /** Estimated payback period e.g. "4–5 Years" */
    private String paybackPeriod;
    /** Estimated annual saving e.g. "₹18,000 / year" */
    private String annualSaving;
    /** EMI option display text e.g. "From ₹3,500 / month" */
    private String emiOption;
}
