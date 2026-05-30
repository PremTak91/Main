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
import com.web.nrs.notification.event.NotificationEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
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
    private final ApplicationEventPublisher eventPublisher;
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
    public List<Map<String, Object>> getLeaveHistoryWithApprover(Long employeeId, boolean isSuperAdmin) {
        if (employeeId == null) {
            return List.of();
        }
        
        List<EmployeeLeaveEntity> leaves;
        if (isSuperAdmin) {
            leaves = employeeLeaveRepository.findAll().stream()
                    .sorted(Comparator.comparing(EmployeeLeaveEntity::getCreatedAt).reversed())
                    .collect(Collectors.toList());
        } else {
            leaves = employeeLeaveRepository.findByEmpMaintainerIdOrderByCreatedAtDesc(employeeId);
        }
        
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
                    
                    leaveMap.put("employeeName", "Unknown");
                    if (isSuperAdmin) {
                        employeeRepository.findById(leave.getEmpMaintainerId())
                                .ifPresent(emp -> leaveMap.put("employeeName", getFullName(emp)));
                    }
                    
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
        
        // Find approver for this employee
        Long approverId = null;
        Optional<EmployeeMainterEntity> maintainer = employeeMainterRepository.findByDesignationIdAndActiveNot(employeeId, 2);
        if (maintainer.isPresent() && maintainer.get().getMainterId() != null) {
            approverId = maintainer.get().getMainterId();
            leave.setEmpMaintainerId(approverId);
        }

        EmployeeLeaveEntity savedLeave = employeeLeaveRepository.save(leave);

        if (approverId != null) {
            String employeeName = employeeRepository.findById(employeeId)
                    .map(this::getFullName)
                    .orElse("An employee");
            String message = String.format("%s has applied for leave from %s to %s. Please review and take action.",
                    employeeName, fromDate, toDate);
            
            eventPublisher.publishEvent(new NotificationEvent(
                    this,
                    "LEAVE_APPLIED",
                    "New Leave Request",
                    message,
                    "/NRS/leave/approval",
                    List.of(approverId)
            ));
        }

        return savedLeave;
    }

    @Override
    public EmployeeLeaveEntity editLeave(Long leaveId, String description, LocalDate fromDate, LocalDate toDate) {
        EmployeeLeaveEntity leave = employeeLeaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
                
        if (!"Pending".equalsIgnoreCase(leave.getStatus())) {
            throw new RuntimeException("Only pending leave requests can be edited");
        }
        
        leave.setLeaveDescription(description);
        leave.setFromDate(fromDate);
        leave.setToDate(toDate);
        leave.setUpdatedAt(LocalDateTime.now());
        
        return employeeLeaveRepository.save(leave);
    }

    @Override
    public void deleteLeave(Long leaveId) {
        EmployeeLeaveEntity leave = employeeLeaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
                
        if (!"Pending".equalsIgnoreCase(leave.getStatus())) {
            throw new RuntimeException("Only pending leave requests can be deleted");
        }
        
        employeeLeaveRepository.delete(leave);
    }

    @Override
    public Long getEmployeeIdByEmail(String email) {
        return employeeRepository.findEmployeeByEmail(email)
                .map(EmployeeEntity::getId)
                .orElse(null);
    }

    @Override
    public List<Map<String, Object>> getPendingLeaveRequestsForApprover(Long approverId, boolean isSuperAdmin) {
        if (approverId == null && !isSuperAdmin) {
            return List.of();
        }
        
        List<EmployeeLeaveEntity> leaves;
        
        if (isSuperAdmin) {
            // Super admins see all leaves sorted by date
            leaves = employeeLeaveRepository.findAll().stream()
                    .sorted(Comparator.comparing(EmployeeLeaveEntity::getCreatedAt).reversed())
                    .collect(Collectors.toList());
        } else {
            // Approvers see only leaves of assigned employees
            List<EmployeeMainterEntity> assignedEmployees = employeeMainterRepository.findByMainterId(approverId);
            List<Long> employeeIds = assignedEmployees.stream()
                    .filter(m -> m.getActive() != null && m.getActive() != 2)
                    .map(EmployeeMainterEntity::getDesignationId)
                    .collect(Collectors.toList());
            
            if (employeeIds.isEmpty()) {
                return List.of();
            }
            
            leaves = employeeLeaveRepository.findByEmpMaintainerIdInOrderByCreatedAtDesc(employeeIds);
        }
        
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

        // Find employee to notify
        List<EmployeeMainterEntity> maintainers = employeeMainterRepository.findByMainterId(leave.getEmpMaintainerId());
        Long applicantId = maintainers.stream()
                .filter(m -> employeeLeaveRepository.findByEmpMaintainerIdInOrderByCreatedAtDesc(List.of(m.getDesignationId()))
                        .stream().anyMatch(l -> l.getLeaveId().equals(leaveId)))
                .map(EmployeeMainterEntity::getDesignationId)
                .findFirst().orElse(null);

        if (applicantId != null) {
            eventPublisher.publishEvent(new NotificationEvent(
                    this,
                    "LEAVE_APPROVED",
                    "Leave Approved",
                    "Your leave request from " + leave.getFromDate() + " to " + leave.getToDate() + " has been approved.",
                    "/NRS/leave",
                    List.of(applicantId)
            ));
        }
    }

    @Override
    public void rejectLeave(Long leaveId, String reason) {
        EmployeeLeaveEntity leave = employeeLeaveRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        leave.setStatus("Rejected");
        leave.setApprovalReason(reason);
        leave.setUpdatedAt(LocalDateTime.now());
        employeeLeaveRepository.save(leave);

        // Find employee to notify
        List<EmployeeMainterEntity> maintainers = employeeMainterRepository.findByMainterId(leave.getEmpMaintainerId());
        Long applicantId = maintainers.stream()
                .filter(m -> employeeLeaveRepository.findByEmpMaintainerIdInOrderByCreatedAtDesc(List.of(m.getDesignationId()))
                        .stream().anyMatch(l -> l.getLeaveId().equals(leaveId)))
                .map(EmployeeMainterEntity::getDesignationId)
                .findFirst().orElse(null);

        if (applicantId != null) {
            eventPublisher.publishEvent(new NotificationEvent(
                    this,
                    "LEAVE_REJECTED",
                    "Leave Rejected",
                    "Your leave request from " + leave.getFromDate() + " to " + leave.getToDate() + " has been rejected. Reason: " + reason,
                    "/NRS/leave",
                    List.of(applicantId)
            ));
        }
    }
    
    private String getFullName(EmployeeEntity employee) {
        return Stream.of(employee.getFirstName(), employee.getLastName())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
    }
}
