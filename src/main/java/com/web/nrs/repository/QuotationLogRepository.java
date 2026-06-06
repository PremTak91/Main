package com.web.nrs.repository;

import com.web.nrs.entity.QuotationLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface QuotationLogRepository extends JpaRepository<QuotationLogEntity, Long> {

    @Query("SELECT q FROM QuotationLogEntity q WHERE " +
           "(:customerName IS NULL OR :customerName = '' OR LOWER(q.customerName) LIKE LOWER(CONCAT('%', :customerName, '%'))) AND " +
           "(:submittedBy IS NULL OR :submittedBy = '' OR LOWER(q.submittedBy) LIKE LOWER(CONCAT('%', :submittedBy, '%'))) AND " +
           "(:fromDate IS NULL OR q.createdDate >= :fromDate) AND " +
           "(:toDate IS NULL OR q.createdDate <= :toDate) AND " +
           "(:createdByName IS NULL OR :createdByName = '' OR q.createdByName = :createdByName)")
    Page<QuotationLogEntity> searchLogs(
            @Param("customerName") String customerName,
            @Param("submittedBy") String submittedBy,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("createdByName") String createdByName,
            Pageable pageable);
}
