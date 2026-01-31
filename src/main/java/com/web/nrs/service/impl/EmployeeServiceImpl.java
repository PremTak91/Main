package com.web.nrs.service.impl;

import com.web.nrs.DTO.EmployeeDTO;
import com.web.nrs.DTO.EmployeeListDTO;
import com.web.nrs.entity.*;
import com.web.nrs.model.EmployeeRegistrationRequest;
import com.web.nrs.repository.*;
import com.web.nrs.service.EmployeeService;
import com.web.nrs.utils.ConstantUtils;
import com.web.nrs.utils.ValidationUtils;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@AllArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    private final PasswordEncoder passwordEncoder;
    private final EmployeeRepository employeeRepository;
    private final LoginRepository loginRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final DesignationRepository designationRepository;
    private final EmployeeAttendanceRepository employeeAttendanceRepository;

    @Override
    public Page<EmployeeListDTO> getAllEmployees(Pageable pageable) {
        Page<EmployeeEntity> employeePage = employeeRepository.findAll(pageable);
        
        return employeePage.map(employee -> {
            // Merge firstName and lastName for name column
            String employeeName = Stream.of(employee.getFirstName(), employee.getLastName())
                    .filter(s -> s != null && !s.isBlank())
                    .collect(Collectors.joining(" "));
            
            // Get designation name
            String designationName = "";
            if (employee.getDesignationId() != null) {
                designationName = designationRepository.findById(employee.getDesignationId())
                        .map(DesignationEntity::getDesignation)
                        .orElse("");
            }
            
            // Get maintainer name (if empMainterId is set)
            String maintainerName = "";
            if (employee.getEmpMainterId() != null) {
                maintainerName = employeeRepository.findById(employee.getEmpMainterId())
                        .map(e -> Stream.of(e.getFirstName(), e.getLastName())
                                .filter(s -> s != null && !s.isBlank())
                                .collect(Collectors.joining(" ")))
                        .orElse("");
            }
            
            // Map employee status (handle null)
            Integer empStatus = employee.getEmpStatus();
            String status;
            if (empStatus == null) {
                status = "Unknown";
            } else {
                status = switch (empStatus) {
                    case 1 -> "Active";
                    case 2 -> "Inactive";
                    case 3 -> "Under Review";
                    case 0 -> "Terminated";
                    default -> "Unknown";
                };
            }
            
            return EmployeeListDTO.builder()
                    .id(employee.getId())
                    .employeeName(employeeName)
                    .phoneNo(employee.getPhoneNo())
                    .designation(designationName)
                    .dateOfJoining(employee.getDateOfJoining())
                    .maintainer(maintainerName)
                    .employeeStatus(status)
                    .build();
        });
    }

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

    @Override
    public String punchIn(Long employeeId) {
        // Check if already punched in (active session)
        Optional<EmployeeAttendanceEntity> activeSession = employeeAttendanceRepository.findTopByEmployeeIdAndOutTimeIsNullOrderByInTimeDesc(employeeId);
        if (activeSession.isPresent()) {
            return "ALREADY_IN";
        }

        EmployeeAttendanceEntity attendance = EmployeeAttendanceEntity.builder()
                .employeeId(employeeId)
                .inTime(LocalDateTime.now())
                .attendanceDate(LocalDate.now())
                .status("IN_PROGRESS")
                .build();
        
        employeeAttendanceRepository.save(attendance);
        return "PUNCHED_IN";
    }

    @Override
    public String punchOut(Long employeeId) {
        // Find active session
        Optional<EmployeeAttendanceEntity> activeSession = employeeAttendanceRepository.findTopByEmployeeIdAndOutTimeIsNullOrderByInTimeDesc(employeeId);
        if (activeSession.isEmpty()) {
            return "ALREADY_OUT";
        }

        EmployeeAttendanceEntity attendance = activeSession.get();
        LocalDateTime outTime = LocalDateTime.now();
        attendance.setOutTime(outTime);

        // Calculate Working Hours
        java.time.Duration duration = java.time.Duration.between(attendance.getInTime(), outTime);
        long hours = duration.toHours();
        long minutes = duration.toMinutesPart();
        String workingHours = String.format("%02d:%02d", hours, minutes);
        attendance.setWorkingHours(workingHours);

        // Update Status based on 8 hours
        if (hours >= 8) {
            attendance.setStatus("PRESENT");
        } else {
            attendance.setStatus("PARTIAL"); // Or "ABSENT" depending on strictness, using PARTIAL for now
        }

        employeeAttendanceRepository.save(attendance);
        
        return "PUNCHED_OUT";
    }

    @Override
    public String getAttendanceStatus(Long employeeId) {
        Optional<EmployeeAttendanceEntity> activeSession = employeeAttendanceRepository.findTopByEmployeeIdAndOutTimeIsNullOrderByInTimeDesc(employeeId);
        return activeSession.isPresent() ? "IN" : "OUT";
    }

    @Override
    public EmployeeEntity getEmployeeDetailsById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
    }

    @Override
    @Transactional
    public boolean updateEmployeeById(Long id, EmployeeRegistrationRequest request) {
        EmployeeEntity employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        if (request.getFirstName() != null && !request.getFirstName().isEmpty()) {
            employee.setFirstName(request.getFirstName());
        }
        if (request.getMiddleName() != null) {
            employee.setMiddleName(request.getMiddleName());
        }
        if (request.getLastName() != null && !request.getLastName().isEmpty()) {
            employee.setLastName(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            employee.setEmail(request.getEmail());
        }
        if (request.getPhoneNo() != null && !request.getPhoneNo().isEmpty()) {
            employee.setPhoneNo(request.getPhoneNo());
        }
        if (request.getAddress() != null) {
            employee.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            employee.setCity(request.getCity());
        }
        if (request.getState() != null) {
            employee.setState(request.getState());
        }
        if (request.getPostalCode() != null) {
            employee.setPostalCode(request.getPostalCode());
        }
        if (request.getDateOfJoining() != null) {
            employee.setDateOfJoining(request.getDateOfJoining());
        }
        if (request.getDesignationId() != null) {
            employee.setDesignationId(request.getDesignationId());
        }
        if (request.getBranch() != null) {
            employee.setBranch(request.getBranch());
        }
        if (request.getEmpMainterId() != null) {
            employee.setEmpMainterId(request.getEmpMainterId());
        }
        if (request.getEmpStatus() != null) {
            employee.setEmpStatus(request.getEmpStatus());
        }

        employeeRepository.save(employee);
        return true;
    }

    @Override
    @Transactional
    public boolean softDeleteEmployee(Long id) {
        EmployeeEntity employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        
        // Set status to 2 (Inactive)
        employee.setEmpStatus(2);
        employeeRepository.save(employee);
        return true;
    }
}

