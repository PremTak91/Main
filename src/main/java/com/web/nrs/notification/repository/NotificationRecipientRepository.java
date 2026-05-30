package com.web.nrs.notification.repository;

import com.web.nrs.notification.entity.NotificationRecipientEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipientEntity, String> {

    @Query("SELECT nr FROM NotificationRecipientEntity nr WHERE nr.recipient.id = :recipientId ORDER BY nr.notification.createdAt DESC")
    Page<NotificationRecipientEntity> findByRecipientIdOrderByCreatedAtDesc(@Param("recipientId") Long recipientId, Pageable pageable);

    @Query("SELECT COUNT(nr) FROM NotificationRecipientEntity nr WHERE nr.recipient.id = :recipientId AND nr.isRead = false")
    long countUnreadByRecipientId(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("UPDATE NotificationRecipientEntity nr SET nr.isRead = true, nr.readAt = :readAt WHERE nr.recipient.id = :recipientId AND nr.isRead = false")
    void markAllAsRead(@Param("recipientId") Long recipientId, @Param("readAt") LocalDateTime readAt);
}
