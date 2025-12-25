package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Entity
@Table(name = "employeeinfo")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String middleName;
    private String lastName;

    @Lob
    private byte[] photo;

    @Column(name = "Address")
    private String address;

    @Column(name = "phoneno")
    private String phoneNo;

    private String email;
    private String city;
    private String state;
    private Long designationId;
    private LocalDate dateOfJoining;
    private int empStatus;
    private Long empMainterId;
    private String branch;
    private Long createId;
    private Long auditUserId;
    private LocalDateTime auditTimeStamp;

}
