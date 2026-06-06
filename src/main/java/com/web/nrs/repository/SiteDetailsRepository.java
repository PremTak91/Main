package com.web.nrs.repository;

import com.web.nrs.entity.SiteDetailsEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SiteDetailsRepository extends JpaRepository<SiteDetailsEntity, Long> {

    @Query("SELECT s FROM SiteDetailsEntity s WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(s.customerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.contactNo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.siteStatus) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:startDate IS NULL OR s.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR s.createdAt <= :endDate) AND " +
           "(:siteOwner IS NULL OR :siteOwner = '' OR s.siteOwner = :siteOwner)")
    Page<SiteDetailsEntity> searchSites(
            @Param("keyword") String keyword, 
            @Param("startDate") java.time.LocalDateTime startDate, 
            @Param("endDate") java.time.LocalDateTime endDate, 
            @Param("siteOwner") String siteOwner,
            Pageable pageable);
}
