package com.web.nrs.notification.service.impl;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.notification.dto.NotificationDTO;
import com.web.nrs.notification.entity.NotificationEntity;
import com.web.nrs.notification.entity.NotificationRecipientEntity;
import com.web.nrs.notification.entity.NotificationTypeEntity;
import com.web.nrs.notification.repository.NotificationRecipientRepository;
import com.web.nrs.notification.repository.NotificationRepository;
import com.web.nrs.notification.repository.NotificationTypeRepository;
import com.web.nrs.notification.service.NotificationService;
import com.web.nrs.notification.service.FCMService;
import com.web.nrs.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationTypeRepository typeRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationRecipientRepository recipientRepository;
    private final EmployeeRepository employeeRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final FCMService fcmService;

    @Override
    @Transactional
    public void createAndSendNotification(String typeCode, String title, String message, String deepLink, List<Long> recipientIds) {
        NotificationTypeEntity type = typeRepository.findByCode(typeCode)
                .orElseGet(() -> {
                    log.warn("Notification type {} not found, using default priority", typeCode);
                    return NotificationTypeEntity.builder().code(typeCode).defaultPriority("MEDIUM").build();
                });

        NotificationEntity notification = NotificationEntity.builder()
                .type(type)
                .title(title)
                .message(message)
                .deepLink(deepLink)
                .priority(type.getDefaultPriority())
                .actionRequired(false)
                .createdAt(LocalDateTime.now())
                .build();

        if (type.getId() == null && notification.getType().getId() != null) {
            typeRepository.save(type);
        }

        notification = notificationRepository.save(notification);

        for (Long empId : recipientIds) {
            EmployeeEntity employee = employeeRepository.findById(empId).orElse(null);
            if (employee == null) continue;

            NotificationRecipientEntity recipient = NotificationRecipientEntity.builder()
                    .notification(notification)
                    .recipient(employee)
                    .isRead(false)
                    .build();
            
            recipientRepository.save(recipient);

            // Send Real-Time Web Socket
            NotificationDTO dto = mapToDTO(recipient);
            messagingTemplate.convertAndSendToUser(
                    empId.toString(),
                    "/queue/notifications",
                    dto
            );

            // Send FCM Push Notification
            fcmService.sendPushNotification(empId, title, message, deepLink);
        }
    }

    @Override
    public Page<NotificationDTO> getUserNotifications(Long userId, Pageable pageable) {
        return recipientRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::mapToDTO);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return recipientRepository.countUnreadByRecipientId(userId);
    }

    @Override
    @Transactional
    public void markAsRead(String recipientId) {
        recipientRepository.findById(recipientId).ifPresent(nr -> {
            nr.setIsRead(true);
            nr.setReadAt(LocalDateTime.now());
            recipientRepository.save(nr);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        recipientRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void deleteNotification(String recipientId) {
        recipientRepository.deleteById(recipientId);
    }

    private NotificationDTO mapToDTO(NotificationRecipientEntity nr) {
        NotificationEntity n = nr.getNotification();
        return NotificationDTO.builder()
                .id(nr.getId())
                .typeCode(n.getType() != null ? n.getType().getCode() : null)
                .title(n.getTitle())
                .message(n.getMessage())
                .deepLink(n.getDeepLink())
                .priority(n.getPriority())
                .actionRequired(n.getActionRequired())
                .isRead(nr.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
