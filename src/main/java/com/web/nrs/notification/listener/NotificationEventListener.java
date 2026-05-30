package com.web.nrs.notification.listener;

import com.web.nrs.notification.event.NotificationEvent;
import com.web.nrs.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("Received notification event: {}", event.getTypeCode());
        try {
            notificationService.createAndSendNotification(
                    event.getTypeCode(),
                    event.getTitle(),
                    event.getMessage(),
                    event.getDeepLink(),
                    event.getRecipientIds()
            );
        } catch (Exception e) {
            log.error("Failed to process notification event: {}", event.getTypeCode(), e);
        }
    }
}
