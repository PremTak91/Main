package com.web.nrs.service.impl;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.WorkLogEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.repository.WorkLogRepository;
import com.web.nrs.service.WorkLogService;
import com.web.nrs.utils.PaginationUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class WorkLogServiceImpl implements WorkLogService {

    @Autowired
    private WorkLogRepository workLogRepository;
    
    @Autowired
    private EmployeeRepository employeeRepository;

    @Override
    public WorkLogEntity saveWorkLog(WorkLogEntity workLog) {
        return workLogRepository.save(workLog);
    }

    @Override
    public Page<WorkLogEntity> getLogsByEmployeeId(Long employeeId, LocalDate startDate, LocalDate endDate, int page, int size, String sortBy, String sortDir) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        
        Page<WorkLogEntity> resultPage;
        if (startDate != null && endDate != null) {
            resultPage = workLogRepository.findByEmployeeIdAndWorkDateBetween(employeeId, startDate, endDate, pageable);
        } else {
            resultPage = workLogRepository.findByEmployeeId(employeeId, pageable);
        }
        
        populateEmployeeDetails(resultPage.getContent());
        
        return resultPage;
    }

    @Override
    public Page<WorkLogEntity> getAllLogs(String keyword, LocalDate startDate, LocalDate endDate, int page, int size, String sortBy, String sortDir) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        
        Page<WorkLogEntity> resultPage;
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            // Find employees matching the keyword
            List<EmployeeEntity> matchingEmployees = employeeRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(keyword, keyword);
            List<Long> employeeIds = matchingEmployees.stream().map(EmployeeEntity::getId).collect(Collectors.toList());
            
            if (employeeIds.isEmpty()) {
                return Page.empty(pageable);
            }
            
            if (startDate != null && endDate != null) {
                resultPage = workLogRepository.findByEmployeeIdInAndWorkDateBetween(employeeIds, startDate, endDate, pageable);
            } else {
                resultPage = workLogRepository.findByEmployeeIdIn(employeeIds, pageable);
            }
        } else {
            if (startDate != null && endDate != null) {
                resultPage = workLogRepository.findByWorkDateBetween(startDate, endDate, pageable);
            } else {
                resultPage = workLogRepository.findAll(pageable);
            }
        }
        
        // Populate transient employee field for UI
        populateEmployeeDetails(resultPage.getContent());
        
        return resultPage;
    }
    
    private void populateEmployeeDetails(List<WorkLogEntity> logs) {
        if (logs == null || logs.isEmpty()) return;
        
        List<Long> employeeIds = logs.stream()
                .map(WorkLogEntity::getEmployeeId)
                .distinct()
                .collect(Collectors.toList());
                
        List<EmployeeEntity> employees = employeeRepository.findAllById(employeeIds);
        Map<Long, EmployeeEntity> employeeMap = employees.stream()
                .collect(Collectors.toMap(EmployeeEntity::getId, Function.identity()));
                
        for (WorkLogEntity log : logs) {
            log.setEmployee(employeeMap.get(log.getEmployeeId()));
        }
    }

    @Override
    public java.util.Optional<WorkLogEntity> getLogById(Long id) {
        return workLogRepository.findById(id);
    }
}
