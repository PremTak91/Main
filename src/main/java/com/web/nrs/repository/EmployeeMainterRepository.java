package com.web.nrs.repository;

import com.web.nrs.entity.EmployeeMainterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeMainterRepository extends JpaRepository<EmployeeMainterEntity, Long> {
    List<EmployeeMainterEntity> findByActive(Integer active);
    List<EmployeeMainterEntity> findByActiveNot(Integer active);
    Optional<EmployeeMainterEntity> findByDesignationIdAndActiveNot(Long designationId, Integer active);
    List<EmployeeMainterEntity> findByMainterId(Long mainterId);
}
