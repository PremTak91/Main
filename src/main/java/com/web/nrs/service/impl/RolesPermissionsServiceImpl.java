package com.web.nrs.service.impl;

import com.web.nrs.DTO.RolesPermissionsDTO;
import com.web.nrs.entity.*;
import com.web.nrs.repository.*;
import com.web.nrs.service.RolesPermissionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RolesPermissionsServiceImpl implements RolesPermissionsService {

    private final EmployeeRepository employeeRepository;
    private final LoginRepository loginRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final DesignationRepository designationRepository;

    @Override
    public List<RolesPermissionsDTO> getManageableUsers() {
        Integer currentMinPriority = getCurrentUserMinPriority();

        List<EmployeeEntity> allEmployees = employeeRepository.findAll();
        List<RolesPermissionsDTO> result = new ArrayList<>();

        for (EmployeeEntity emp : allEmployees) {
            Optional<LoginEntity> loginOpt = loginRepository.findById(emp.getId());
            if (loginOpt.isPresent()) {
                LoginEntity login = loginOpt.get();
                List<RoleEntity> roles = login.getUserRoles().stream()
                        .map(UserRoleEntity::getRoles)
                        .collect(Collectors.toList());

                Integer userMinPriority = roles.stream()
                        .map(RoleEntity::getPriority)
                        .min(Integer::compare)
                        .orElse(999);

                // Hierarchy check: Can only see users with strictly GREATER priority (lower authority)
                if (currentMinPriority < userMinPriority) {
                    List<String> roleNames = roles.stream().map(RoleEntity::getRoleId).collect(Collectors.toList());
                    List<Long> roleIds = roles.stream().map(RoleEntity::getId).collect(Collectors.toList());
                    String designationName = fetchDesignationName(emp.getDesignationId());

                    result.add(RolesPermissionsDTO.builder()
                            .employeeId(emp.getId())
                            .employeeName(emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : ""))
                            .designation(designationName)
                            .roles(roleNames)
                            .roleIds(roleIds)
                            .loginId(login.getId())
                            .build());
                }
            }
        }
        return result;
    }

    @Override
    public List<RoleEntity> getAssignableRoles() {
        Integer currentMinPriority = getCurrentUserMinPriority();
        return roleRepository.findAll().stream()
                .filter(role -> role.getPriority() > currentMinPriority)
                .collect(Collectors.toList());
    }

    @Override
    public List<RoleEntity> getAllRoles() {
        return roleRepository.findAll();
    }

    @Override
    @Transactional
    public void saveOrUpdateRole(RoleEntity role) {
        if (role.getPriority() == null) {
            throw new RuntimeException("Role priority is required");
        }
        
        // Prevent assigning priority higher than (or equal to if not superAdmin) current user
        Integer currentMinPriority = getCurrentUserMinPriority();
        if (role.getPriority() <= currentMinPriority) {
            // Check if superAdmin (priority 1) - only SuperAdmins can manage priority 1 if allowed
            // But usually, one cannot create/edit a role to their own level or higher
            throw new RuntimeException("Cannot create/edit role with priority higher than or equal to your own authority level");
        }

        if (role.getId() != null) {
            RoleEntity existing = roleRepository.findById(role.getId())
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            existing.setRoleId(role.getRoleId());
            existing.setDescription(role.getDescription());
            existing.setPriority(role.getPriority());
            roleRepository.save(existing);
        } else {
            roleRepository.save(role);
        }
    }

    @Override
    @Transactional
    public void deleteRole(Long id) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        Integer currentMinPriority = getCurrentUserMinPriority();
        if (role.getPriority() <= currentMinPriority) {
            throw new RuntimeException("Cannot delete role with authority level equal to or higher than yours");
        }

        if (!role.getUserRoles().isEmpty()) {
            throw new RuntimeException("Cannot delete role as it is currently assigned to users");
        }
        
        roleRepository.delete(role);
    }

    @Override
    public List<RolesPermissionsDTO> getAssignableEmployees() {
        Integer currentMinPriority = getCurrentUserMinPriority();

        List<EmployeeEntity> allEmployees = employeeRepository.findAll();
        List<RolesPermissionsDTO> result = new ArrayList<>();

        for (EmployeeEntity emp : allEmployees) {
            Optional<LoginEntity> loginOpt = loginRepository.findById(emp.getId());
            Integer userMinPriority = 999;
            List<String> roleNames = new ArrayList<>();
            List<Long> roleIds = new ArrayList<>();
            
            if (loginOpt.isPresent()) {
                List<RoleEntity> roles = loginOpt.get().getUserRoles().stream()
                        .map(UserRoleEntity::getRoles)
                        .collect(Collectors.toList());
                
                roleNames = roles.stream().map(RoleEntity::getRoleId).collect(Collectors.toList());
                roleIds = roles.stream().map(RoleEntity::getId).collect(Collectors.toList());
                
                userMinPriority = roles.stream()
                        .map(RoleEntity::getPriority)
                        .min(Integer::compare)
                        .orElse(999);
            }

            // Can see if target has lower authority
            if (currentMinPriority < userMinPriority) {
                result.add(RolesPermissionsDTO.builder()
                        .employeeId(emp.getId())
                        .employeeName(emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : ""))
                        .designation(fetchDesignationName(emp.getDesignationId()))
                        .loginId(loginOpt.map(LoginEntity::getId).orElse(null))
                        .roles(roleNames)
                        .roleIds(roleIds)
                        .build());
            }
        }
        return result;
    }

    @Override
    @Transactional
    public void assignRoles(Long employeeId, List<Long> roleIds) {
        // Enforce Single Role requirement: take only the first one if multiple are provided
        Long singleRoleId = (roleIds != null && !roleIds.isEmpty()) ? roleIds.get(0) : null;

        Integer currentMinPriority = getCurrentUserMinPriority();

        EmployeeEntity employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // 1. Try to find login by ID (primary key)
        Optional<LoginEntity> loginOpt = loginRepository.findById(employee.getId());
        
        // 2. If not found by ID, try finding by Username (Email) as backup
        if (loginOpt.isEmpty()) {
            loginOpt = loginRepository.findByUsername(employee.getEmail());
        }

        // Security Check: Is the target employee manageable by the current user?
        if (loginOpt.isPresent()) {
            LoginEntity existingLogin = loginOpt.get();
            Integer targetMinPriority = existingLogin.getUserRoles().stream()
                    .map(ur -> ur.getRoles().getPriority())
                    .min(Integer::compare)
                    .orElse(999);
            
            if (currentMinPriority >= targetMinPriority) {
                // Special case: if user has no high-priority roles yet, they are manageable
                if (targetMinPriority < 999) {
                    throw new RuntimeException("Permission Denied: Cannot modify roles of users with equal or higher authority level");
                }
            }
        }

        LoginEntity user;
        if (loginOpt.isPresent()) {
            user = loginOpt.get();
            // Ensure ID is correct if found by username - though this might be tricky if ID shifted
            // If primary key is different, we have a conflict. 
            // For now, if found by username, we use that record.
            if (!user.getId().equals(employee.getId())) {
                // If the IDs differ, this is the cause of the duplicate error.
                // We should ideally use the employee.getId() as the source of truth.
                // But we can't change the PK of an existing record in many DBs easily via JPA.
                // So we'll update the record's details if needed.
            }
        } else {
            user = new LoginEntity();
            user.setId(employee.getId()); 
            user.setUsername(employee.getEmail());
            user.setPassword("Default@123");
            loginRepository.save(user);
        }

        // Enforce Single Role: Clear and Add only one
        user.getUserRoles().clear();
        loginRepository.saveAndFlush(user);

        if (singleRoleId != null) {
            RoleEntity role = roleRepository.findById(singleRoleId)
                    .orElseThrow(() -> new RuntimeException("Role not found with ID: " + singleRoleId));
            
            // Security Check: Is the assigned role allowed?
            if (role.getPriority() <= currentMinPriority) {
                throw new RuntimeException("Permission Denied: Cannot assign role with authority level equal to or higher than yours");
            }

            UserRoleEntity userRole = new UserRoleEntity();
            userRole.setId(new UserRoleId(user.getId(), role.getId()));
            userRole.setUser(user);
            userRole.setRoles(role);
            user.getUserRoles().add(userRole);
        }
        
        loginRepository.save(user);
    }

    private Integer getCurrentUserMinPriority() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return 999;
        
        List<String> roleNames = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        
        return roleNames.stream()
                .map(name -> roleRepository.findByRoleId(name)
                        .map(RoleEntity::getPriority)
                        .orElse(999))
                .min(Integer::compare)
                .orElse(999);
    }

    private String getHighestRole(List<String> roles) {
        if (roles == null || roles.isEmpty()) return "User";
        
        return roles.stream()
                .map(name -> roleRepository.findByRoleId(name).orElse(null))
                .filter(Objects::nonNull)
                .min(Comparator.comparingInt(RoleEntity::getPriority))
                .map(RoleEntity::getRoleId)
                .orElse("User");
    }

    private int getRoleLevel(String roleName) {
        return roleRepository.findByRoleId(roleName)
                .map(RoleEntity::getPriority)
                .orElse(999);
    }

    private String fetchDesignationName(Long designationId) {
        if (designationId == null) return "";
        return designationRepository.findById(designationId)
                .map(DesignationEntity::getDesignation)
                .orElse("");
    }
}
