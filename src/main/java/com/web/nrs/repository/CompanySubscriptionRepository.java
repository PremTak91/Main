package com.web.nrs.repository;

import com.web.nrs.entity.CompanySubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanySubscriptionRepository extends JpaRepository<CompanySubscriptionEntity, Long> {
    Optional<CompanySubscriptionEntity> findByCompanyId(Long companyId);
}
