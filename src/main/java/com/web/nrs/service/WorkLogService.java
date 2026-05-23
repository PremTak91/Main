package com.web.nrs.service;

import com.web.nrs.entity.WorkLogEntity;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface WorkLogService {
    
    WorkLogEntity saveWorkLog(WorkLogEntity workLog);
    
    Page<WorkLogEntity> getLogsByEmployeeId(Long employeeId, LocalDate startDate, LocalDate endDate, int page, int size, String sortBy, String sortDir);
    
    Page<WorkLogEntity> getAllLogs(String keyword, LocalDate startDate, LocalDate endDate, int page, int size, String sortBy, String sortDir);
    
    java.util.Optional<WorkLogEntity> getLogById(Long id);
    
}
