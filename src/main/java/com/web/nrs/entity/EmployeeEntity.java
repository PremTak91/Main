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
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String middleName;
    private String lastName;


    private String photo;

    private String qualification;

    @Column(name = "Address")
    private String address;

    @Column(name = "phoneno")
    private String phoneNo;
    private String dateOfBirth;
    private Long postalCode;
    private String email;
    private String city;
    private String state;
    private Long designationId;
    private LocalDate dateOfJoining;
    private Integer empStatus;
    private Long empMainterId;
    private String branch;
    private Long createId;
    private Long auditUserId;
    private LocalDateTime auditTimeStamp;
    private Integer previousExperience;



    @Transient
    public String getFullName() {
        return Stream.of(firstName, lastName)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
    }
}
