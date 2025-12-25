package com.web.nrs.service;

import com.web.nrs.entity.DesignationEntity;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.RoleEntity;
import com.web.nrs.model.EmployeeRegistrationRequest;

import java.util.List;
import java.util.Optional;

public interface EmployeeService {
    public boolean save(EmployeeRegistrationRequest employeeRegistrationRequest);

    List<RoleEntity> getAllRoles();

    List<DesignationEntity> getAllDesignation();
    Optional<EmployeeEntity> getEmployeeByEmailId(String emailId);
}
