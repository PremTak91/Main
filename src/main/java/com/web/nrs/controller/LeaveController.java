package com.web.nrs.controller;

import com.web.nrs.utils.ApiResponse;
import com.web.nrs.entity.HolidayEntity;
import com.web.nrs.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @GetMapping
    public String viewLeaveBalanceAndStatus(Model model) {
        // Get current user email from security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        // Get employee ID from email
        Long employeeId = leaveService.getEmployeeIdByEmail(email);
        
        int currentYear = LocalDate.now().getYear();
        
        // 1. Get holidays for current year
        List<HolidayEntity> holidays = leaveService.getHolidaysForYear(currentYear);
        
        // 2. Calculate leave balance (12 default - approved leaves)
        int leaveBalance = leaveService.calculateLeaveBalance(employeeId, currentYear);
        
        // 3. Get leave history with approver names
        List<Map<String, Object>> leaveHistory = leaveService.getLeaveHistoryWithApprover(employeeId);
        
        // 4. Get assigned approver for apply leave form
        Map<String, Object> approverInfo = leaveService.getAssignedApprover(employeeId);
        
        model.addAttribute("holidays", holidays);
        model.addAttribute("leaveBalance", leaveBalance);
        model.addAttribute("leaveHistory", leaveHistory);
        model.addAttribute("approverName", approverInfo.get("approverName"));
        model.addAttribute("approverId", approverInfo.get("approverId"));
        model.addAttribute("employeeId", employeeId);
        
        return "leaveBalanceAndStatus";
    }

    @PostMapping
    @ResponseBody
    public ResponseEntity<ApiResponse> applyLeave(@RequestBody Map<String, Object> request) {
        try {
            Long employeeId = Long.valueOf(request.get("employeeId").toString());
            String description = request.get("description").toString();
            LocalDate fromDate = LocalDate.parse(request.get("fromDate").toString());
            LocalDate toDate = LocalDate.parse(request.get("toDate").toString());
            
            leaveService.applyLeave(employeeId, description, fromDate, toDate);
            return ResponseEntity.ok(ApiResponse.success("Leave application submitted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/approval")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public String viewLeaveRequestApproval(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        Long approverId = leaveService.getEmployeeIdByEmail(email);
        
        List<Map<String, Object>> leaveRequests = leaveService.getPendingLeaveRequestsForApprover(approverId);
        model.addAttribute("leaveRequests", leaveRequests);
        
        return "leaveRequestApproval";
    }

    @PutMapping("/approve/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @ResponseBody
    public ResponseEntity<ApiResponse> approveLeave(@PathVariable Long id) {
        try {
            leaveService.approveLeave(id, "Accepted");
            return ResponseEntity.ok(ApiResponse.success("Leave approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/reject/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    @ResponseBody
    public ResponseEntity<ApiResponse> rejectLeave(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String reason = request.get("reason").toString();
            leaveService.rejectLeave(id, reason);
            return ResponseEntity.ok(ApiResponse.success("Leave rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
