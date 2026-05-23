package com.web.nrs.repository;

import com.web.nrs.entity.WorkLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface WorkLogRepository extends JpaRepository<WorkLogEntity, Long> {

    Page<WorkLogEntity> findByEmployeeId(Long employeeId, Pageable pageable);

    Page<WorkLogEntity> findByEmployeeIdAndWorkDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<WorkLogEntity> findByWorkDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<WorkLogEntity> findByEmployeeIdIn(java.util.List<Long> employeeIds, Pageable pageable);

    Page<WorkLogEntity> findByEmployeeIdInAndWorkDateBetween(java.util.List<Long> employeeIds, LocalDate startDate, LocalDate endDate, Pageable pageable);
}
