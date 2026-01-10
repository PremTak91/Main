package com.web.nrs.service.impl;

import com.web.nrs.DTO.EmployeeDTO;
import com.web.nrs.entity.*;
import com.web.nrs.model.EmployeeRegistrationRequest;
import com.web.nrs.repository.*;
import com.web.nrs.service.EmployeeService;
import com.web.nrs.utils.ConstantUtils;
import com.web.nrs.utils.ValidationUtils;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.UUID;
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
        EmployeeEntity employee = new EmployeeEntity();

        employee.setFirstName(employeeDetails.getFirstName());
        employee.setMiddleName(employeeDetails.getMiddleName());
        employee.setLastName(employeeDetails.getLastName());
        employee.setEmail(employeeDetails.getEmail());
        employee.setPhoneNo(employeeDetails.getPhoneNumber());
        employee.setDesignationId(employeeDetails.getDesignationId());
        employee.setDateOfJoining(employeeDetails.getDateOfJoining());
        employee.setEmpStatus(1);
        employee.setAuditTimeStamp(LocalDateTime.now());
        employee.setPreviousExperience(employeeDetails.getPreviousExperience());

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

    @Override
    public EmployeeDTO getProfileDetailsByEmailId(String emailId) {
        EmployeeEntity  employeeEntity = ValidationUtils.throwIfNull(getEmployeeByEmailId(emailId),
                () -> new RuntimeException("User not found")
                ).get();

        DesignationEntity designationEntity = designationRepository.findById(employeeEntity.getDesignationId())
                .orElseThrow(() -> new RuntimeException("Designation details is not correct"));

        return EmployeeDTO.builder().build().getEmployeeDTO(employeeEntity, designationEntity);
    }
    @Override
    @Transactional
    public boolean updateEmployee(EmployeeEntity employee, EmployeeRegistrationRequest employeeDetails, MultipartFile photo) {

        if (employeeDetails.getEmail() != null && !employeeDetails.getEmail().isEmpty()) {
            employee.setEmail(employeeDetails.getEmail());
        }
        if (employeeDetails.getPhoneNo() != null && !employeeDetails.getPhoneNo().isEmpty()) {
            employee.setPhoneNo(employeeDetails.getPhoneNo());
        }
        if (employeeDetails.getAddress() != null && !employeeDetails.getAddress().isEmpty()) {
            employee.setAddress(employeeDetails.getAddress());
        }
        if (employeeDetails.getPostalCode() != null) {
            employee.setPostalCode(employeeDetails.getPostalCode());
        }
        if (employeeDetails.getQualification() != null && !employeeDetails.getQualification().isEmpty()) {
            employee.setQualification(employeeDetails.getQualification());
        }

        if (employeeDetails.getDesignation() != null && !employeeDetails.getDesignation().isEmpty()) {
             DesignationEntity designation = designationRepository.findByDesignation(employeeDetails.getDesignation())
                    .orElseThrow(() -> new RuntimeException("Designation not found: " + employeeDetails.getDesignation()));
             employee.setDesignationId(designation.getId());
        }

        if (photo != null && !photo.isEmpty()) {
            try {
                String fileName = UUID.randomUUID().toString() + "_" + photo.getOriginalFilename();
                Path uploadPath = Paths.get(ConstantUtils.EMPLOYEE_PROFILE_PATH);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Path filePath = uploadPath.resolve(fileName);
                Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                employee.setPhoto(fileName);
            } catch (IOException e) {
                throw new RuntimeException("Failed to upload photo", e);
            }
        }

        employeeRepository.save(employee);
        return true;
    }

    @Override
    public Optional<EmployeeEntity> findEmployeeById(long id) {
        return employeeRepository.findById(id);
    }
}
