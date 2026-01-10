package com.web.nrs.repository;

import com.web.nrs.entity.DesignationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DesignationRepository extends JpaRepository<DesignationEntity, Long> {
    Optional<DesignationEntity> findByDesignation(String designation);
}
