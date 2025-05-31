package com.web.nrs.model;

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
	public double getKw() {
		return kw;
	}
	public void setKw(double kw) {
		this.kw = kw;
	}
	public String getSolarType() {
		return solarType;
	}
	public void setSolarType(String solarType) {
		this.solarType = solarType;
	}
	public String getPanelsName() {
		return panelsName;
	}
	public void setPanelsName(String panelsName) {
		this.panelsName = panelsName;
	}
	public double getRateKw() {
		return rateKw;
	}
	public void setRateKw(double rateKw) {
		this.rateKw = rateKw;
	}
	public double getValue() {
		return value;
	}
	public void setValue(double value) {
		this.value = value;
	}
	public double getDiscomMeter() {
		return discomMeter;
	}
	public void setDiscomMeter(double discomMeter) {
		this.discomMeter = discomMeter;
	}
	public double getPqHsCost() {
		return pqHsCost;
	}
	public void setPqHsCost(double pqHsCost) {
		this.pqHsCost = pqHsCost;
	}
	public double getActualPrice() {
		return actualPrice;
	}
	public void setActualPrice(double actualPrice) {
		this.actualPrice = actualPrice;
	}
	public double getSubsidy() {
		return subsidy;
	}
	public void setSubsidy(double subsidy) {
		this.subsidy = subsidy;
	}
	public double getEffectivePrice() {
		return effectivePrice;
	}
	public void setEffectivePrice(double effectivePrice) {
		this.effectivePrice = effectivePrice;
	}
	public String getSubmittedBy() {
		return submittedBy;
	}
	public void setSubmittedBy(String submittedBy) {
		this.submittedBy = submittedBy;
	}
	public String getSubmittedNumber() {
		return submittedNumber;
	}
	public void setSubmittedNumber(String submittedNumber) {
		this.submittedNumber = submittedNumber;
	}

}
