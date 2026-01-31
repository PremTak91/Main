package com.web.nrs.DTO;

import com.web.nrs.entity.DesignationEntity;
import com.web.nrs.entity.EmployeeEntity;
import jakarta.persistence.Transient;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.Period;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Builder
@Data
public class EmployeeDTO {
    private long id;
    private String userName;
    private String photo;
    private String email;
    private String phoneNo;
    private String designation;
    private String address;
    private long postCode;
    private String dateOfBirth;
    private String qualification;
    private String companyExperience;
    private String totalExperience;



    @Transient
    public String getUserName(String firstName, String middleName, String lastName) {
        return Stream.of(firstName, middleName, lastName)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
    }

    @Transient
    public EmployeeDTO getEmployeeDTO(EmployeeEntity employeeEntity, DesignationEntity designationEntity){
        return EmployeeDTO.builder()
                .id(employeeEntity.getId())
                .userName(getUserName(employeeEntity.getFirstName(), employeeEntity.getMiddleName(), employeeEntity.getLastName()))
                .photo(employeeEntity.getPhoto())
                .email(employeeEntity.getEmail())
                .phoneNo(employeeEntity.getPhoneNo())
                .designation(designationEntity.getDesignation())
                .address(employeeEntity.getAddress())
                .postCode(null != employeeEntity.getPostalCode() ? employeeEntity.getPostalCode() : 0)
                .dateOfBirth(employeeEntity.getDateOfBirth())
                .qualification(employeeEntity.getQualification())
                .companyExperience(calculateExperience(employeeEntity.getDateOfJoining()))
                .totalExperience(calculateExperience(employeeEntity.getDateOfJoining(), employeeEntity.getPreviousExperience()))
                .build();
    }


    public static String calculateExperience(LocalDate dateOfJoining) {
        if (dateOfJoining == null) return "0 Years 0 Months 0 Days";
        LocalDate today = LocalDate.now();
        Period period = Period.between(dateOfJoining, today);
        return String.format("%d Years %d Months %d Days",
                period.getYears(),
                period.getMonths(),
                period.getDays());
    }

    public static String calculateExperience(LocalDate dateOfJoining, Integer previousExperience) {
        int prevExp = previousExperience != null ? previousExperience : 0;
        if (dateOfJoining == null) return prevExp + " Years 0 Months 0 Days";
        
        LocalDate today = LocalDate.now();
        Period period = Period.between(dateOfJoining, today);
        
        // Add previous experience (assuming it's in years) to the calculated years
        int totalYears = period.getYears() + prevExp;
        
        return String.format("%d Years %d Months %d Days",
                totalYears,
                period.getMonths(),
                period.getDays());
    }
}
