package com.web.nrs.controller;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.WorkLogEntity;
import com.web.nrs.service.EmployeeService;
import com.web.nrs.service.WorkLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/worklogs")
@PreAuthorize("!hasRole('DEALER')")
public class WorkLogController {

    @Autowired
    private WorkLogService workLogService;

    @Autowired
    private EmployeeService employeeService;

    private Long getLoggedInEmployeeId(Authentication authentication) {
        String email = authentication.getName();
        return employeeService.getEmployeeByEmailId(email)
                .map(EmployeeEntity::getId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN") || a.getAuthority().equals("ROLE_ADMIN"));
    }

    @GetMapping
    public String getWorkLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "workDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Model model,
            Authentication authentication) {

        Page<WorkLogEntity> logPage;

        if (isAdmin(authentication)) {
            // Admin sees all logs
            logPage = workLogService.getAllLogs(keyword, startDate, endDate, page, size, sortBy, sortDir);
        } else {
            // Employee sees only their own logs (keyword search ignored)
            Long employeeId = getLoggedInEmployeeId(authentication);
            logPage = workLogService.getLogsByEmployeeId(employeeId, startDate, endDate, page, size, sortBy, sortDir);
        }

        model.addAttribute("logs", logPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", logPage.getTotalPages());
        model.addAttribute("totalItems", logPage.getTotalElements());
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("keyword", keyword);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");

        return "worklog-list";
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<?> getWorkLog(@PathVariable Long id, Authentication authentication) {
        try {
            WorkLogEntity log = workLogService.getLogById(id).orElseThrow(() -> new RuntimeException("Log not found"));
            
            // Check authorization
            if (!isAdmin(authentication)) {
                Long currentEmployeeId = getLoggedInEmployeeId(authentication);
                if (!log.getEmployeeId().equals(currentEmployeeId)) {
                    return ResponseEntity.status(403).body(Map.of("success", false, "message", "Unauthorized to view this log"));
                }
            }
            
            return ResponseEntity.ok(log);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/save")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> saveWorkLog(
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam("workDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate workDate,
            @RequestParam("workDescription") String workDescription,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        try {
            Long employeeId = getLoggedInEmployeeId(authentication);
            WorkLogEntity log;

            if (id != null) {
                log = workLogService.getLogById(id).orElseThrow(() -> new RuntimeException("Log not found"));
                // Ensure only the owner (or admin if allowed, though normally only owner edits) can edit
                if (!log.getEmployeeId().equals(employeeId) && !isAdmin(authentication)) {
                    throw new RuntimeException("Unauthorized to edit this log");
                }
                log.setWorkDate(workDate);
                log.setWorkDescription(workDescription);
            } else {
                log = WorkLogEntity.builder()
                        .employeeId(employeeId)
                        .workDate(workDate)
                        .workDescription(workDescription)
                        .build();
            }

            workLogService.saveWorkLog(log);

            response.put("success", true);
            response.put("message", "Work log saved successfully.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to save work log: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
