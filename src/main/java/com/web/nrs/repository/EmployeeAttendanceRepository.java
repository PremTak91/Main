package com.web.nrs.repository;

import com.web.nrs.entity.EmployeeAttendanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeAttendanceRepository extends JpaRepository<EmployeeAttendanceEntity, Long> {
    Optional<EmployeeAttendanceEntity> findByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);
    
    // Find active punch-in for checking status (where outTime is null)
    Optional<EmployeeAttendanceEntity> findTopByEmployeeIdAndOutTimeIsNullOrderByInTimeDesc(Long employeeId);
    
    // For manual query or reporting later
    List<EmployeeAttendanceEntity> findByEmployeeId(Long employeeId);

    // Find entries that are still open (outTime is null) for auto-logout job
    List<EmployeeAttendanceEntity> findByOutTimeIsNull();

    List<EmployeeAttendanceEntity> findByOutTimeIsNullAndInTimeBefore(java.time.LocalDateTime time);
}
