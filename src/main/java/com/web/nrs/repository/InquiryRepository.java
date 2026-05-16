package com.web.nrs.repository;

import com.web.nrs.entity.InquiryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

@Repository
public interface InquiryRepository extends JpaRepository<InquiryEntity, Long> {
    Page<InquiryEntity> findByCreatedByAndCreatedAtAfter(Long createdBy, LocalDateTime startOfDay, Pageable pageable);
}
