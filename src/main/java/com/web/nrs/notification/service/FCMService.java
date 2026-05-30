package com.web.nrs.notification.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

@Slf4j
@Service
@RequiredArgsConstructor
public class FCMService {

    private final EmployeeRepository employeeRepository;

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("firebase-adminsdk.json");
            if (resource.exists()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                        .build();
                if (FirebaseApp.getApps().isEmpty()) {
                    FirebaseApp.initializeApp(options);
                    log.info("Firebase Admin SDK initialized successfully.");
                }
            } else {
                log.warn("firebase-adminsdk.json not found in resources. Push notifications will be disabled.");
            }
        } catch (Exception e) {
            log.error("Failed to initialize Firebase Admin SDK", e);
        }
    }

    public void sendPushNotification(Long userId, String title, String messageStr, String deepLink) {
        try {
            EmployeeEntity emp = employeeRepository.findById(userId).orElse(null);
            if (emp == null || emp.getFcmToken() == null || emp.getFcmToken().isEmpty()) {
                log.warn("Cannot send push notification to user {}: No FCM token registered.", userId);
                return;
            }

            if (FirebaseApp.getApps().isEmpty()) {
                log.warn("Firebase App not initialized. Skipping push notification.");
                return;
            }

            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(messageStr)
                    .build();

            Message.Builder messageBuilder = Message.builder()
                    .setToken(emp.getFcmToken())
                    .setNotification(notification)
                    .putData("title", title)
                    .putData("body", messageStr);

            if (deepLink != null && !deepLink.isEmpty()) {
                messageBuilder.putData("deepLink", deepLink);
            }

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.info("Successfully sent FCM push notification: {}", response);

        } catch (Exception e) {
            log.error("Error sending FCM notification to user {}", userId, e);
        }
    }
}
