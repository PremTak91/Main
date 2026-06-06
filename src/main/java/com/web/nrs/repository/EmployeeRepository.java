package com.web.nrs.repository;

import com.web.nrs.entity.EmployeeEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository  extends JpaRepository<EmployeeEntity, Long> {

    Optional<EmployeeEntity> findEmployeeByEmail(String email);

    java.util.List<EmployeeEntity> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM EmployeeEntity e, user_login l, UserRoleEntity ur, RoleEntity r WHERE e.email = l.username AND l.id = ur.user.id AND ur.roles.id = r.id AND r.roleId = 'DEALER'")
    java.util.List<EmployeeEntity> findDealers();
}
