package com.web.nrs.pojo;

import java.sql.Date;
import java.sql.Timestamp;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "userinfo", catalog = "nrsdb")
public class UserInfo {

	private int id;
	private int roleId; 
	private String firstName; 
	private String middleName; 
	private String lastName; 
	private String password; 
	private byte photo; 
	private String Address; 
	private String phoneno; 
	private String email; 
	private String city; 
	private String state; 
	private int position; 
	private Date dateOfJoining; 
	private String empStatus; 
	private int empMainterId; 
	private int Branch; 
	private int createId; 
	private int auditUserId; 
	private Timestamp auditTimeStamp;
	
	@Id
	@Column(name = "id", unique = true, nullable = false, precision = 8, scale = 0)
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	@Column(name = "roleId", precision = 8, scale = 0)
	public int getRoleId() {
		return roleId;
	}
	public void setRoleId(int roleId) {
		this.roleId = roleId;
	}
	public String getFirstName() {
		return firstName;
	}
	
	
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}
	public String getMiddleName() {
		return middleName;
	}
	public void setMiddleName(String middleName) {
		this.middleName = middleName;
	}
	public String getLastName() {
		return lastName;
	}
	public void setLastName(String lastName) {
		this.lastName = lastName;
	}
	public byte getPhoto() {
		return photo;
	}
	public void setPhoto(byte photo) {
		this.photo = photo;
	}
	public String getAddress() {
		return Address;
	}
	public void setAddress(String address) {
		Address = address;
	}
	public String getPhoneno() {
		return phoneno;
	}
	public void setPhoneno(String phoneno) {
		this.phoneno = phoneno;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getCity() {
		return city;
	}
	public void setCity(String city) {
		this.city = city;
	}
	public String getState() {
		return state;
	}
	public void setState(String state) {
		this.state = state;
	}
	@Column(name = "position", precision = 8, scale = 0)
	public int getPosition() {
		return position;
	}
	public void setPosition(int position) {
		this.position = position;
	}
	public Date getDateOfJoining() {
		return dateOfJoining;
	}
	public void setDateOfJoining(Date dateOfJoining) {
		this.dateOfJoining = dateOfJoining;
	}
	public String getEmpStatus() {
		return empStatus;
	}
	public void setEmpStatus(String empStatus) {
		this.empStatus = empStatus;
	}
	@Column(name = "empMainterId", precision = 8, scale = 0)
	public int getEmpMainterId() {
		return empMainterId;
	}
	public void setEmpMainterId(int empMainterId) {
		this.empMainterId = empMainterId;
	}
	@Column(name = "branch", precision = 8, scale = 0)
	public int getBranch() {
		return Branch;
	}
	public void setBranch(int branch) {
		Branch = branch;
	}
	@Column(name = "createrId", precision = 8, scale = 0)
	public int getCreateId() {
		return createId;
	}
	public void setCreateId(int createId) {
		this.createId = createId;
	}
	@Column(name = "auditUserId", precision = 8, scale = 0)
	public int getAuditUserId() {
		return auditUserId;
	}
	public void setAuditUserId(int auditUserId) {
		this.auditUserId = auditUserId;
	}
	public Timestamp getAuditTimeStamp() {
		return auditTimeStamp;
	}
	public void setAuditTimeStamp(Timestamp auditTimeStamp) {
		this.auditTimeStamp = auditTimeStamp;
	}
	
}
