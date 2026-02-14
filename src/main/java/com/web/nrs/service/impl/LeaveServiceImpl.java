package com.web.nrs.service.impl;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.EmployeeLeaveEntity;
import com.web.nrs.entity.EmployeeMainterEntity;
import com.web.nrs.entity.HolidayEntity;
import com.web.nrs.repository.EmployeeLeaveRepository;
import com.web.nrs.repository.EmployeeMainterRepository;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.repository.HolidayRepository;
import com.web.nrs.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class LeaveServiceImpl implements LeaveService {

    private static final int DEFAULT_LEAVE_BALANCE = 12;
    
    private final HolidayRepository holidayRepository;
    private final EmployeeLeaveRepository employeeLeaveRepository;
    private final EmployeeMainterRepository employeeMainterRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    public List<HolidayEntity> getHolidaysForYear(int year) {
        return holidayRepository.findByYearOrderByHolidayDateAsc(year);
    }

    @Override
    public int calculateLeaveBalance(Long employeeId, int year) {
        if (employeeId == null) {
            return DEFAULT_LEAVE_BALANCE;
        }
        
        Long usedLeaves = employeeLeaveRepository.sumApprovedLeaveDaysForYear(employeeId, year);
        if (usedLeaves == null) {
            return DEFAULT_LEAVE_BALANCE;
        }
        
        int balance = DEFAULT_LEAVE_BALANCE - usedLeaves.intValue();
        return Math.max(balance, 0);
    }

    @Override
    public List<Map<String, Object>> getLeaveHistoryWithApprover(Long employeeId) {
        if (employeeId == null) {
            return List.of();
        }
        
        List<EmployeeLeaveEntity> leaves = employeeLeaveRepository.findByEmpMaintainerIdOrderByCreatedAtDesc(employeeId);
        
        return leaves.stream()
                .map(leave -> {
                    Map<String, Object> leaveMap = new HashMap<>();
                    leaveMap.put("id", leave.getLeaveId());
                    leaveMap.put("description", leave.getLeaveDescription());
                    leaveMap.put("fromDate", leave.getFromDate());
                    leaveMap.put("toDate", leave.getToDate());
                    leaveMap.put("status", leave.getStatus());
                    leaveMap.put("approverName", "N/A");
                    leaveMap.put("approvalReason", leave.getApprovalReason() != null ? leave.getApprovalReason() : "");
                    
                    // Get approver name from maintainer assignment
                    Optional<EmployeeMainterEntity> maintainer = employeeMainterRepository
                            .findByDesignationIdAndActiveNot(employeeId, 2);
                    maintainer.ifPresent(m -> {
                        employeeRepository.findById(m.getMainterId())
                                .ifPresent(approver -> {
                                    String name = getFullName(approver);
                                    leaveMap.put("approverName", name);
                                });
                    });
                    
                    return leaveMap;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> getAssignedApprover(Long employeeId) {
        Map<String, Object> result = new HashMap<>();
        result.put("approverName", "Not Assigned");
        result.put("approverId", null);
        
        if (employeeId == null) {
            return result;
        }
        
        Optional<EmployeeMainterEntity> maintainer = employeeMainterRepository
                .findByDesignationIdAndActiveNot(employeeId, 2);
        
        if (maintainer.isPresent()) {
            Long approverId = maintainer.get().getMainterId();
            result.put("approverId", approverId);
            
            employeeRepository.findById(approverId)
                    .ifPresent(approver -> result.put("approverName", getFullName(approver)));
        }
        
        return result;
    }

    @Override
    public EmployeeLeaveEntity applyLeave(Long employeeId, String description, LocalDate fromDate, LocalDate toDate) {
        EmployeeLeaveEntity leave = EmployeeLeaveEntity.builder()
                .empMaintainerId(employeeId)
                .leaveDescription(description)
                .fromDate(fromDate)
                .toDate(toDate)
                .status("Pending")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        return employeeLeaveRepository.save(leave);
    }

    @Override
    public Long getEmployeeIdByEmail(String email) {
        return employeeRepository.findEmployeeByEmail(email)
                .map(EmployeeEntity::getId)
                .orElse(null);
    }

    @Override
    public List<Map<String, Object>> getPendingLeaveRequestsForApprover(Long approverId) {
        if (approverId == null) {
            return List.of();
        }
        
        // Find all employees assigned to this approver
        List<EmployeeMainterEntity> assignedEmployees = employeeMainterRepository.findByMainterId(approverId);
        List<Long> employeeIds = assignedEmployees.stream()
                .filter(m -> m.getActive() != null && m.getActive() != 2)
                .map(EmployeeMainterEntity::getDesignationId)
                .collect(Collectors.toList());
        
        if (employeeIds.isEmpty()) {
            return List.of();
        }
        
        List<EmployeeLeaveEntity> leaves = employeeLeaveRepository.findByEmpMaintainerIdInOrderByCreatedAtDesc(employeeIds);
        
        return leaves.stream()
                .map(leave -> {
                    Map<String, Object> leaveMap = new HashMap<>();
                    leaveMap.put("id", leave.getLeaveId());
                    leaveMap.put("description", leave.getLeaveDescription());
                    leaveMap.put("fromDate", leave.getFromDate());
                    leaveMap.put("toDate", leave.getToDate());
                    leaveMap.put("status", leave.getStatus());
                    leaveMap.put("approvalReason", leave.getApprovalReason() != null ? leave.getApprovalReason() : "");
                    leaveMap.put("employeeName", "Unknown");
                    
                    employeeRepository.findById(leave.getEmpMaintainerId())
                            .ifPresent(emp -> leaveMap.put("employeeName", getFullName(emp)));
                    
                    return leaveMap;
                })
                .collect(Collectors.toList());
    }

    @Override
    public void approveLeave(Long leaveId, String reason) {
        EmployeeLeaveEntity leave = employeeLeaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        leave.setStatus("Approved");
        leave.setApprovalReason(reason != null ? reason : "Accepted");
        leave.setUpdatedAt(LocalDateTime.now());
        employeeLeaveRepository.save(leave);
    }

    @Override
    public void rejectLeave(Long leaveId, String reason) {
        EmployeeLeaveEntity leave = employeeLeaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        leave.setStatus("Rejected");
        leave.setApprovalReason(reason);
        leave.setUpdatedAt(LocalDateTime.now());
        employeeLeaveRepository.save(leave);
    }
    
    private String getFullName(EmployeeEntity employee) {
        return Stream.of(employee.getFirstName(), employee.getLastName())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
    }
}
