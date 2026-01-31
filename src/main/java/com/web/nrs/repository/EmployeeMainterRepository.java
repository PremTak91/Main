package com.web.nrs.repository;

import com.web.nrs.entity.EmployeeMainterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeMainterRepository extends JpaRepository<EmployeeMainterEntity, Long> {
    List<EmployeeMainterEntity> findByActive(Integer active);
}
