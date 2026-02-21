package com.web.nrs.controller;

import com.web.nrs.DTO.EmployeeListDTO;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.EmployeeMainterEntity;
import com.web.nrs.model.EmployeeRegistrationRequest;
import com.web.nrs.repository.EmployeeMainterRepository;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.repository.LoginRepository;
import com.web.nrs.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import com.web.nrs.entity.RoleEntity;
import com.web.nrs.entity.DesignationEntity;

@Controller
@RequestMapping("/employee")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final EmployeeMainterRepository employeeMainterRepository;
    private final EmployeeRepository employeeRepository;
    private final LoginRepository loginRepository;

    @GetMapping
    public String viewEmployeeManagement(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            Model model
    ) {
        Sort sort = sortDir.equalsIgnoreCase("desc") 
                ? Sort.by(sortBy).descending() 
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<EmployeeListDTO> employeePage = employeeService.getAllEmployees(pageable);
        
        // Load active maintainers with their names (ensuring uniqueness)
        List<EmployeeMainterEntity> mainters = employeeMainterRepository.findByActive(1);
        List<Map<String, Object>> maintainerList = mainters.stream()
                .map(EmployeeMainterEntity::getMainterId)
                .distinct()
                .map(mainterId -> {
                    Map<String, Object> maintainerMap = new HashMap<>();
                    maintainerMap.put("id", mainterId);
                    // Get maintainer name from employee table
                    employeeRepository.findById(mainterId)
                            .ifPresent(emp -> {
                                String name = Stream.of(emp.getFirstName(), emp.getLastName())
                                        .filter(s -> s != null && !s.isBlank())
                                        .collect(Collectors.joining(" "));
                                maintainerMap.put("name", name);
                            });
                    return maintainerMap;
                })
                .filter(m -> m.get("name") != null)
                .collect(Collectors.toList());
        
        model.addAttribute("employees", employeePage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", employeePage.getTotalPages());
        model.addAttribute("totalItems", employeePage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");
        model.addAttribute("maintainers", maintainerList);
        model.addAttribute("rolesList", employeeService.getAllRoles());
        model.addAttribute("designationList", employeeService.getAllDesignation());
        
        return "employee";
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getEmployeeById(@PathVariable Long id) {
        try {
            EmployeeEntity employee = employeeService.getEmployeeDetailsById(id);
            Map<String, Object> response = new HashMap<>();
            response.put("employee", employee);
            
            // Fetch roleId from LoginEntity
            loginRepository.findById(id).ifPresent(login -> {
                if (!login.getUserRoles().isEmpty()) {
                    Long roleId = login.getUserRoles().iterator().next().getRoles().getId();
                    response.put("roleId", roleId);
                }
            });
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateEmployee(
            @PathVariable Long id, 
            @RequestBody EmployeeRegistrationRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean updated = employeeService.updateEmployeeById(id, request);
            if (updated) {
                response.put("success", true);
                response.put("message", "Employee updated successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Failed to update employee");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteEmployee(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean deleted = employeeService.softDeleteEmployee(id);
            if (deleted) {
                response.put("success", true);
                response.put("message", "Employee deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Failed to delete employee");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
