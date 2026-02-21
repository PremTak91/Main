package com.web.nrs.controller;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.EmployeeMainterEntity;
import com.web.nrs.repository.EmployeeMainterRepository;
import com.web.nrs.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Controller
@RequestMapping("/leaveRole")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
public class LeaveRoleController {

    private final EmployeeMainterRepository employeeMainterRepository;
    private final EmployeeRepository employeeRepository;

    @GetMapping
    public String viewLeaveRoleManagement(Model model) {
        // Get all leave roles (excluding deleted ones - active != 2)
        List<EmployeeMainterEntity> leaveRoles = employeeMainterRepository.findByActiveNot(2);
        
        // Transform to include employee names
        List<Map<String, Object>> leaveRoleList = leaveRoles.stream()
                .map(role -> {
                    Map<String, Object> roleMap = new HashMap<>();
                    roleMap.put("id", role.getId());
                    roleMap.put("employeeId", role.getDesignationId());
                    roleMap.put("approverId", role.getMainterId());
                    roleMap.put("active", role.getActive());
                    
                    // Get employee name
                    employeeRepository.findById(role.getDesignationId())
                            .ifPresent(emp -> {
                                String name = Stream.of(emp.getFirstName(), emp.getLastName())
                                        .filter(s -> s != null && !s.isBlank())
                                        .collect(Collectors.joining(" "));
                                roleMap.put("employeeName", name);
                            });
                    
                    // Get approver name
                    employeeRepository.findById(role.getMainterId())
                            .ifPresent(emp -> {
                                String name = Stream.of(emp.getFirstName(), emp.getLastName())
                                        .filter(s -> s != null && !s.isBlank())
                                        .collect(Collectors.joining(" "));
                                roleMap.put("approverName", name);
                            });
                    
                    return roleMap;
                })
                .filter(m -> m.get("employeeName") != null && m.get("approverName") != null)
                .collect(Collectors.toList());
        
        // Get all employees for dropdown
        List<EmployeeEntity> allEmployees = employeeRepository.findAll();
        List<Map<String, Object>> employeeList = allEmployees.stream()
                .map(emp -> {
                    Map<String, Object> empMap = new HashMap<>();
                    empMap.put("id", emp.getId());
                    String name = Stream.of(emp.getFirstName(), emp.getLastName())
                            .filter(s -> s != null && !s.isBlank())
                            .collect(Collectors.joining(" "));
                    empMap.put("name", name);
                    return empMap;
                })
                .filter(m -> m.get("name") != null && !((String)m.get("name")).isBlank())
                .collect(Collectors.toList());
        
        // Get active maintainers for approver dropdown
        List<EmployeeMainterEntity> mainters = employeeMainterRepository.findByActive(1);
        List<Map<String, Object>> approverList = mainters.stream()
                .map(mainter -> {
                    Map<String, Object> approverMap = new HashMap<>();
                    approverMap.put("id", mainter.getMainterId());
                    employeeRepository.findById(mainter.getMainterId())
                            .ifPresent(emp -> {
                                String name = Stream.of(emp.getFirstName(), emp.getLastName())
                                        .filter(s -> s != null && !s.isBlank())
                                        .collect(Collectors.joining(" "));
                                approverMap.put("name", name);
                            });
                    return approverMap;
                })
                .filter(m -> m.get("name") != null)
                .distinct()
                .collect(Collectors.toList());
        
        model.addAttribute("leaveRoles", leaveRoleList);
        model.addAttribute("employees", employeeList);
        model.addAttribute("approvers", approverList);
        
        return "leaveRole";
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<EmployeeMainterEntity> getLeaveRoleById(@PathVariable Long id) {
        try {
            EmployeeMainterEntity leaveRole = employeeMainterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Leave role not found"));
            return ResponseEntity.ok(leaveRole);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addLeaveRole(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long employeeId = Long.valueOf(request.get("employeeId").toString());
            Long approverId = Long.valueOf(request.get("approverId").toString());
            Integer active = Integer.valueOf(request.get("active").toString());
            
            EmployeeMainterEntity leaveRole = EmployeeMainterEntity.builder()
                    .designationId(employeeId)
                    .mainterId(approverId)
                    .active(active)
                    .auditTimestamp(LocalDateTime.now())
                    .build();
            
            employeeMainterRepository.save(leaveRole);
            
            response.put("success", true);
            response.put("message", "Leave role added successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateLeaveRole(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            EmployeeMainterEntity leaveRole = employeeMainterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Leave role not found"));
            
            if (request.containsKey("employeeId")) {
                leaveRole.setDesignationId(Long.valueOf(request.get("employeeId").toString()));
            }
            if (request.containsKey("approverId")) {
                leaveRole.setMainterId(Long.valueOf(request.get("approverId").toString()));
            }
            if (request.containsKey("active")) {
                leaveRole.setActive(Integer.valueOf(request.get("active").toString()));
            }
            leaveRole.setAuditTimestamp(LocalDateTime.now());
            
            employeeMainterRepository.save(leaveRole);
            
            response.put("success", true);
            response.put("message", "Leave role updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteLeaveRole(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            EmployeeMainterEntity leaveRole = employeeMainterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Leave role not found"));
            
            // Soft delete - set active to 2
            leaveRole.setActive(2);
            leaveRole.setAuditTimestamp(LocalDateTime.now());
            employeeMainterRepository.save(leaveRole);
            
            response.put("success", true);
            response.put("message", "Leave role deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
