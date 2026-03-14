package com.web.nrs.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SolarQuotation {
    private double kw;
    private String solarType;
    private String panelsName;
    private double rateKw;
    private double value;
    private double discomMeter;
    private double pqHsCost;
    private double actualPrice;
    private double subsidy;
    private double effectivePrice;
    private String submittedBy;
    private String submittedNumber;
	private String quationNumber;
    private long discountAmount;
}
