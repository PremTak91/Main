package com.web.nrs.repository;

import com.web.nrs.entity.LoginEntity;
import com.web.nrs.entity.PasswordResetTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, Long> {
    Optional<PasswordResetTokenEntity> findByToken(String token);
    Optional<PasswordResetTokenEntity> findByUser(LoginEntity user);
    void deleteByUser(LoginEntity user);
}
