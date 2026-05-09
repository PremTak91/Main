package com.web.nrs.controller;

import com.web.nrs.DTO.TimesheetDTO;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.service.EmployeeService;
import com.web.nrs.utils.ApiResponse;
import com.web.nrs.utils.PaginationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/timesheet")
@RequiredArgsConstructor
public class TimesheetController {

    private final EmployeeService employeeService;

    @GetMapping
    public String viewTimesheet(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "attendanceDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Authentication authentication,
            Model model
    ) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        String email = authentication.getName();
        Optional<EmployeeEntity> currentEmployee = employeeService.getEmployeeByEmailId(email);

        boolean isAdmin = false;
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        for (GrantedAuthority authority : authorities) {
            if (authority.getAuthority().equals("ROLE_ADMIN") || authority.getAuthority().equals("ROLE_SUPERADMIN")) {
                isAdmin = true;
                break;
            }
        }

        Long filterEmployeeId = null;
        String filterEmployeeName = employeeName;

        if (!isAdmin) {
            // Normal user can only see their own timesheet
            if (currentEmployee.isPresent()) {
                filterEmployeeId = currentEmployee.get().getId();
            }
            filterEmployeeName = null; // Ignore name search for normal users
        }

        Page<TimesheetDTO> timesheetPage = employeeService.getTimesheetRecords(filterEmployeeId, filterEmployeeName, startDate, endDate, pageable);

        String totalWorkingHours = null;
        if ((filterEmployeeName != null && !filterEmployeeName.isEmpty()) || startDate != null || endDate != null || !isAdmin) {
             totalWorkingHours = employeeService.calculateTotalWorkingHours(filterEmployeeId, filterEmployeeName, startDate, endDate);
        }

        model.addAttribute("timesheets", timesheetPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", timesheetPage.getTotalPages());
        model.addAttribute("totalItems", timesheetPage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");
        
        model.addAttribute("searchName", filterEmployeeName);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);
        model.addAttribute("isAdmin", isAdmin);
        model.addAttribute("totalWorkingHours", totalWorkingHours);

        return "timesheet";
    }

    @PutMapping("/{id}")
    @ResponseBody
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse> editTimesheet(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestData
    ) {
        try {
            LocalDateTime inTime = null;
            LocalDateTime outTime = null;

            if (requestData.containsKey("inTime") && !requestData.get("inTime").isEmpty()) {
                inTime = LocalDateTime.parse(requestData.get("inTime"));
            }
            if (requestData.containsKey("outTime") && !requestData.get("outTime").isEmpty()) {
                outTime = LocalDateTime.parse(requestData.get("outTime"));
            }

            boolean updated = employeeService.editTimesheetRecord(id, inTime, outTime);
            if (updated) {
                return ResponseEntity.ok(ApiResponse.success("Timesheet updated successfully"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update timesheet"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
