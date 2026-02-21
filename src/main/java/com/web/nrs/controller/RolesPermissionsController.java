package com.web.nrs.controller;

import com.web.nrs.DTO.RolesPermissionsDTO;
import com.web.nrs.entity.RoleEntity;
import com.web.nrs.service.RolesPermissionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.access.prepost.PreAuthorize;

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
    public ResponseEntity<List<RolesPermissionsDTO>> getEmployees() {
        return ResponseEntity.ok(rolesPermissionsService.getAssignableEmployees());
    }

    @GetMapping("/api/roles")
    @ResponseBody
    public ResponseEntity<List<RoleEntity>> getRoles() {
        return ResponseEntity.ok(rolesPermissionsService.getAssignableRoles());
    }

    @GetMapping("/api/roles/all")
    @ResponseBody
    public ResponseEntity<List<RoleEntity>> getAllRoles() {
        return ResponseEntity.ok(rolesPermissionsService.getAllRoles());
    }

    @PostMapping("/api/roles/save")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> saveRole(@RequestBody RoleEntity role) {
        Map<String, Object> response = new HashMap<>();
        try {
            rolesPermissionsService.saveOrUpdateRole(role);
            response.put("success", true);
            response.put("message", "Role saved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/api/roles/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteRole(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            rolesPermissionsService.deleteRole(id);
            response.put("success", true);
            response.put("message", "Role deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/assign")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> assignRoles(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long employeeId = Long.valueOf(request.get("employeeId").toString());
            List<Object> rawRoleIds = (List<Object>) request.get("roleIds");
            List<Long> roleIds = rawRoleIds.stream()
                    .map(id -> Long.valueOf(id.toString()))
                    .collect(Collectors.toList());
            
            rolesPermissionsService.assignRoles(employeeId, roleIds);
            
            response.put("success", true);
            response.put("message", "Roles assigned successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
