package com.web.nrs.service;

import com.web.nrs.entity.EmployeeLeaveEntity;
import com.web.nrs.entity.HolidayEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface LeaveService {
    
    // Holiday operations
    List<HolidayEntity> getHolidaysForYear(int year);
    
    // Leave balance
    int calculateLeaveBalance(Long employeeId, int year);
    
    // Leave history
    List<Map<String, Object>> getLeaveHistoryWithApprover(Long employeeId, boolean isSuperAdmin);
    
    // Get assigned approver
    Map<String, Object> getAssignedApprover(Long employeeId);
    
    // Apply leave
    EmployeeLeaveEntity applyLeave(Long employeeId, String description, LocalDate fromDate, LocalDate toDate);
    
    // Edit leave
    EmployeeLeaveEntity editLeave(Long leaveId, String description, LocalDate fromDate, LocalDate toDate);
    
    // Delete leave
    void deleteLeave(Long leaveId);
    
    // Get employee ID by email
    Long getEmployeeIdByEmail(String email);
    
    // Leave request approval
    List<Map<String, Object>> getPendingLeaveRequestsForApprover(Long approverId, boolean isSuperAdmin);
    void approveLeave(Long leaveId, String reason);
    void rejectLeave(Long leaveId, String reason);
}
