package com.web.nrs.repository;

import com.web.nrs.entity.CompanyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyRepository extends JpaRepository<CompanyEntity, Long> {
    List<CompanyEntity> findByDeletedFalse();
}
