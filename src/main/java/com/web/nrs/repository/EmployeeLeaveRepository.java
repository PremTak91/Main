package com.web.nrs.repository;

import com.web.nrs.entity.EmployeeLeaveEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeLeaveRepository extends JpaRepository<EmployeeLeaveEntity, Long> {
    
    List<EmployeeLeaveEntity> findByEmpMaintainerIdOrderByCreatedAtDesc(Long empMaintainerId);
    
    @Query("SELECT COUNT(e) FROM EmployeeLeaveEntity e WHERE e.empMaintainerId = :empMaintainerId " +
           "AND e.status = 'Approved' AND YEAR(e.fromDate) = :year")
    Long countApprovedLeavesForYear(@Param("empMaintainerId") Long empMaintainerId, @Param("year") Integer year);
    
    @Query("SELECT SUM(DATEDIFF(e.toDate, e.fromDate) + 1) FROM EmployeeLeaveEntity e " +
           "WHERE e.empMaintainerId = :empMaintainerId AND e.status = 'Approved' AND YEAR(e.fromDate) = :year")
    Long sumApprovedLeaveDaysForYear(@Param("empMaintainerId") Long empMaintainerId, @Param("year") Integer year);
    
    List<EmployeeLeaveEntity> findByEmpMaintainerIdInOrderByCreatedAtDesc(List<Long> empMaintainerIds);
}
