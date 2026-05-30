package com.web.nrs.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FCMService {

    // Note: Mock FCM implementation until google-services.json is provided
    public void sendPushNotification(Long userId, String title, String message, String deepLink) {
        log.info("MOCK FCM PUSH - To User ID: {}, Title: '{}', Message: '{}', DeepLink: '{}'",
                userId, title, message, deepLink);
        
        // Future Implementation:
        // 1. Fetch user's FCM device token from database
        // 2. Build Firebase Message object
        // 3. Send using FirebaseMessaging.getInstance().sendAsync(message)
    }
}
