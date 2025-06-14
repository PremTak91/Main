package com.web.nrs.pojo;



import java.sql.Date;
import java.sql.Timestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name = "blcsheet", catalog = "nrsdb")
public class BalanceSheet {

	private int id;
	private String payment_desc;
	private double total_amt;
	private double advance_amt;
	private Date entrydate; 
	private String status;
	private int given_to;
	private int branch;
	private int audit_UserId;
	private Timestamp audittimestamp;

		
	@Override
	public String toString() {
		return "BalanceSheet [id=" + id + ", payment_desc=" + payment_desc + ", total_amt=" + total_amt
				+ ", advance_amt=" + advance_amt + ", entrydate=" + entrydate + ", status=" + status + ", given_to="
				+ given_to + ", branch=" + branch + ", audit_UserId=" + audit_UserId + ", audittimestamp="
				+ audittimestamp + "]";
	}
	
	@Id
	@Column(name = "id", unique = true, nullable = false, precision = 8, scale = 0)
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getPayment_desc() {
		return payment_desc;
	}
	public void setPayment_desc(String payment_desc) {
		this.payment_desc = payment_desc;
	}
	public double getTotal_amt() {
		return total_amt;
	}
	public void setTotal_amt(double total_amt) {
		this.total_amt = total_amt;
	}
	public double getAdvance_amt() {
		return advance_amt;
	}
	public void setAdvance_amt(double advance_amt) {
		this.advance_amt = advance_amt;
	}
	public Date getEntrydate() {
		return entrydate;
	}
	public void setEntrydate(Date entrydate) {
		this.entrydate = entrydate;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public int getGiven_to() {
		return given_to;
	}
	public void setGiven_to(int given_to) {
		this.given_to = given_to;
	}
	public int getBranch() {
		return branch;
	}
	public void setBranch(int branch) {
		this.branch = branch;
	}
	public int getAudit_UserId() {
		return audit_UserId;
	}
	public void setAudit_UserId(int audit_UserId) {
		this.audit_UserId = audit_UserId;
	}
	public Timestamp getAudittimestamp() {
		return audittimestamp;
	}
	public void setAudittimestamp(Timestamp audittimestamp) {
		this.audittimestamp = audittimestamp;
	}
	
	
	
	
	
}
