package com.web.nrs.repository;

import com.web.nrs.entity.ManualTimesheetRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ManualTimesheetRequestRepository extends JpaRepository<ManualTimesheetRequestEntity, Long> {
    List<ManualTimesheetRequestEntity> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<ManualTimesheetRequestEntity> findByApproverIdAndStatusOrderByCreatedAtDesc(Long approverId, String status);
    List<ManualTimesheetRequestEntity> findByStatusOrderByCreatedAtDesc(String status);
    List<ManualTimesheetRequestEntity> findByApproverIdOrderByCreatedAtDesc(Long approverId);
}
