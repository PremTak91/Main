package com.web.nrs.repository;

import com.web.nrs.entity.CompanyModuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyModuleRepository extends JpaRepository<CompanyModuleEntity, Long> {
    List<CompanyModuleEntity> findByCompanyId(Long companyId);
    Optional<CompanyModuleEntity> findByCompanyIdAndModuleCode(Long companyId, String moduleCode);
}
