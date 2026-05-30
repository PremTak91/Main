package com.web.nrs.notification.service;

import com.web.nrs.notification.dto.NotificationDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {

    void createAndSendNotification(String typeCode, String title, String message, String deepLink, List<Long> recipientIds);
    
    Page<NotificationDTO> getUserNotifications(Long userId, Pageable pageable);
    
    long getUnreadCount(Long userId);
    
    void markAsRead(String recipientId);
    
    void markAllAsRead(Long userId);
    
    void deleteNotification(String recipientId);
}
