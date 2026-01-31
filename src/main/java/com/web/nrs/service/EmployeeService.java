package com.web.nrs.service;

import com.web.nrs.DTO.EmployeeDTO;
import com.web.nrs.DTO.EmployeeListDTO;
import com.web.nrs.entity.DesignationEntity;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.RoleEntity;
import com.web.nrs.model.EmployeeRegistrationRequest;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

public interface EmployeeService {
    Page<EmployeeListDTO> getAllEmployees(Pageable pageable);
    public boolean save(EmployeeRegistrationRequest employeeRegistrationRequest);

    List<RoleEntity> getAllRoles();

    List<DesignationEntity> getAllDesignation();
    Optional<EmployeeEntity> getEmployeeByEmailId(String emailId);

    EmployeeDTO getProfileDetailsByEmailId(String emailId);

    boolean updateEmployee(EmployeeEntity employee, EmployeeRegistrationRequest employeeDetails, MultipartFile photo);
    Optional<EmployeeEntity> findEmployeeById(long id);

    String punchIn(Long employeeId);
    String punchOut(Long employeeId);
    String getAttendanceStatus(Long employeeId);

    // Employee edit and delete
    EmployeeEntity getEmployeeDetailsById(Long id);
    boolean updateEmployeeById(Long id, EmployeeRegistrationRequest request);
    boolean softDeleteEmployee(Long id);
}
