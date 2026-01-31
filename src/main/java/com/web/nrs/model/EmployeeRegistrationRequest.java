package com.web.nrs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRegistrationRequest {
    private long employeeId;
    private String firstName;
    private String middleName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String password;
    private Long roleId;
    private Long designationId;
    private LocalDate dateOfJoining;
    private String address;
    private String phoneNo;
    private String designation;
    private String qualification;
    private Long postalCode;
    private Integer previousExperience;
    private String city;
    private String state;
    private String branch;
    private Long empMainterId;
    private Integer empStatus;
}
