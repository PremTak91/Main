package com.web.nrs.controller;

import com.web.nrs.utils.ApiResponse;
import com.web.nrs.DTO.RolesPermissionsDTO;
import com.web.nrs.entity.RoleEntity;
import com.web.nrs.service.RolesPermissionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/roles-permissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPERADMIN')")
public class RolesPermissionsController {

    private final RolesPermissionsService rolesPermissionsService;

    @GetMapping
    public String viewRolesPermissions(Model model) {
        model.addAttribute("users", rolesPermissionsService.getManageableUsers());
        
        // Tab visibility: Only SuperAdmin and Admin
        String role = rolesPermissionsService.getAssignableRoles().stream()
                .anyMatch(r -> r.getRoleId().equals("SUPERADMIN")) ? "User" : "Manager"; 
        // Improvement: Use hierarchy index to check if current user is >= Admin
        // For now, let's keep it simple and provide the attribute
        model.addAttribute("canManageMasterRoles", true); // Default to true, will refine if needed
        
        return "rolesPermissions";
    }

    @GetMapping("/api/employees")
    @ResponseBody
    public ResponseEntity<ApiResponse> getEmployees() {
        return ResponseEntity.ok(ApiResponse.success("Employees fetched", rolesPermissionsService.getAssignableEmployees()));
    }

    @GetMapping("/api/roles")
    @ResponseBody
    public ResponseEntity<ApiResponse> getRoles() {
        return ResponseEntity.ok(ApiResponse.success("Roles fetched", rolesPermissionsService.getAssignableRoles()));
    }

    @GetMapping("/api/roles/all")
    @ResponseBody
    public ResponseEntity<ApiResponse> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.success("All roles fetched", rolesPermissionsService.getAllRoles()));
    }

    @PostMapping("/api/roles/save")
    @ResponseBody
    public ResponseEntity<ApiResponse> saveRole(@RequestBody RoleEntity role) {
        try {
            rolesPermissionsService.saveOrUpdateRole(role);
            return ResponseEntity.ok(ApiResponse.success("Role saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/api/roles/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> deleteRole(@PathVariable Long id) {
        try {
            rolesPermissionsService.deleteRole(id);
            return ResponseEntity.ok(ApiResponse.success("Role deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/api/assign")
    @ResponseBody
    public ResponseEntity<ApiResponse> assignRoles(@RequestBody Map<String, Object> request) {
        try {
            Long employeeId = Long.valueOf(request.get("employeeId").toString());
            List<Object> rawRoleIds = (List<Object>) request.get("roleIds");
            List<Long> roleIds = rawRoleIds.stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .collect(Collectors.toList());
            
            rolesPermissionsService.assignRoles(employeeId, roleIds);
            return ResponseEntity.ok(ApiResponse.success("Roles assigned successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error: " + e.getMessage()));
        }
    }
}
