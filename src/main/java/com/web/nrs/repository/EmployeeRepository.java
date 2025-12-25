package com.web.nrs.repository;

import com.web.nrs.entity.EmployeeEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository  extends JpaRepository<EmployeeEntity, Long> {

    Optional<EmployeeEntity> findEmployeeByEmail(String email);
}
