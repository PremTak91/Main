package com.web.nrs.repository;

import com.web.nrs.entity.ExpensesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

@Repository
public interface ExpensesRepository extends JpaRepository<ExpensesEntity, Long> {
    Page<ExpensesEntity> findByCreatedByAndCreatedAtAfter(Long createdBy, LocalDateTime startOfDay, Pageable pageable);
}
