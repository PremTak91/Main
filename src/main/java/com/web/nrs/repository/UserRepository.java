package com.web.nrs.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.web.nrs.entity.LoginEntity;

import java.util.Optional;

public interface UserRepository extends JpaRepository<LoginEntity, Long> {
    Optional<LoginEntity> findByUsername(String username);
}