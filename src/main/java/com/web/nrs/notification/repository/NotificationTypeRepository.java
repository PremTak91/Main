package com.web.nrs.notification.repository;

import com.web.nrs.notification.entity.NotificationTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationTypeRepository extends JpaRepository<NotificationTypeEntity, Long> {
    Optional<NotificationTypeEntity> findByCode(String code);
}
