package com.web.nrs.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.nrs.entity.RoleEntity;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {
    Optional<RoleEntity> findByRoleName(String roleName);
}