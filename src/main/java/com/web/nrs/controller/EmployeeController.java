package com.web.nrs.controller;

import com.web.nrs.DTO.EmployeeListDTO;
import com.web.nrs.utils.ApiResponse;
import com.web.nrs.utils.PaginationUtils;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.EmployeeMainterEntity;
import com.web.nrs.model.EmployeeRegistrationRequest;
import com.web.nrs.repository.EmployeeMainterRepository;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.repository.LoginRepository;
import com.web.nrs.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<EmployeeListDTO> employeePage = employeeService.getAllEmployees(pageable);
        
        // Load active maintainers with their names (ensuring uniqueness)
        List<EmployeeMainterEntity> mainters = employeeMainterRepository.findByActive(1);
        List<Map<String, Object>> maintainerList = mainters.stream()
                .map(EmployeeMainterEntity::getMainterId)
                .distinct()
                .map(mainterId -> {
                    Map<String, Object> maintainerMap = new HashMap<>();
                    maintainerMap.put("id", mainterId);
                    employeeRepository.findById(mainterId)
                            .ifPresent(emp -> maintainerMap.put("name", emp.getFullName()));
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
    public ResponseEntity<ApiResponse> getEmployeeById(@PathVariable Long id) {
        try {
            EmployeeEntity employee = employeeService.getEmployeeDetailsById(id);
            Map<String, Object> data = new HashMap<>();
            data.put("employee", employee);

            loginRepository.findById(id).ifPresent(login -> {
                if (!login.getUserRoles().isEmpty()) {
                    Long roleId = login.getUserRoles().iterator().next().getRoles().getId();
                    data.put("roleId", roleId);
                }
            });

            return ResponseEntity.ok(ApiResponse.success("Employee fetched", data));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Employee not found"));
        }
    }

    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> updateEmployee(
            @PathVariable Long id,
            @RequestBody EmployeeRegistrationRequest request) {
        try {
            boolean updated = employeeService.updateEmployeeById(id, request);
            if (updated) {
                return ResponseEntity.ok(ApiResponse.success("Employee updated successfully"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update employee"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> deleteEmployee(@PathVariable Long id) {
        try {
            boolean deleted = employeeService.softDeleteEmployee(id);
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.success("Employee deleted successfully"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete employee"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
