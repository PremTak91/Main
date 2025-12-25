package com.web.nrs.service.impl;

import com.web.nrs.entity.*;
import com.web.nrs.model.EmployeeRegistrationRequest;
import com.web.nrs.repository.*;
import com.web.nrs.service.EmployeeService;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employeeRepository;
    private final LoginRepository loginRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final DesignationRepository designationRepository;

    @Override
    @Transactional
    public boolean save(EmployeeRegistrationRequest employeeDetails) {

        // 1️⃣ Save Employee
        EmployeeEntity employee = EmployeeEntity.builder()
                .firstName(employeeDetails.getFirstName())
                .middleName(employeeDetails.getMiddleName())
                .lastName(employeeDetails.getLastName())
                .email(employeeDetails.getEmail())
                .phoneNo(employeeDetails.getPhoneNumber())
                .designationId(employeeDetails.getDesignationId())
                .dateOfJoining(employeeDetails.getDateOfJoining())
                .empStatus(1)
                .auditTimeStamp(LocalDateTime.now())
                .build();

        employee = employeeRepository.save(employee);

        // 2️⃣ Save Login
        LoginEntity login = new LoginEntity();
        login.setId(employee.getId());
        login.setUsername(employeeDetails.getEmail());
        login.setCustomId("NRS-" + employee.getId());
        login.setPassword(passwordEncoder.encode(employeeDetails.getPassword()));

        login = loginRepository.save(login);

        // 3️⃣ Fetch Role
        RoleEntity role = roleRepository.findById(employeeDetails.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // 4️⃣ Create Composite Key
        UserRoleId userRoleId = new UserRoleId(login.getId(), role.getId());

        // 5️⃣ Create UserRole Mapping
        UserRoleEntity userRole = new UserRoleEntity();
        userRole.setId(userRoleId);
        userRole.setUser(login);     // REQUIRED for @MapsId
        userRole.setRoles(role);     // REQUIRED for @MapsId

        // 6️⃣ Save Mapping
        UserRoleEntity userRoleEntity = userRoleRepository.save(userRole);
        return true;
    }


    @Override
    public List<RoleEntity> getAllRoles() {
        return roleRepository.findAll();
    }

    @Override
    public List<DesignationEntity> getAllDesignation() {
        return designationRepository.findAll();
    }

    @Override
    public Optional<EmployeeEntity> getEmployeeByEmailId(String emailId) {
        return employeeRepository.findEmployeeByEmail(emailId);
    }
}
