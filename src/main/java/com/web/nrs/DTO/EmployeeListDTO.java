package com.web.nrs.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EmployeeListDTO {
    private long id;
    private String employeeName;  // Merged firstName + lastName
    private String phoneNo;
    private String designation;
    private LocalDate dateOfJoining;
    private String maintainer;
    private String employeeStatus;
}
