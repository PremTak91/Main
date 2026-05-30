package com.web.nrs.notification.controller;

import com.web.nrs.utils.ApiResponse;
import com.web.nrs.notification.dto.NotificationDTO;
import com.web.nrs.notification.service.NotificationService;
import com.web.nrs.service.EmployeeService;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.entity.EmployeeEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepository;

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return employeeService.getEmployeeByEmailId(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }

    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(notificationService.getUserNotifications(getCurrentUserId(), PageRequest.of(page, size)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount(getCurrentUserId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead() {
        notificationService.markAllAsRead(getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable String id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted"));
    }

    @PostMapping("/fcm-token")
    public ResponseEntity<ApiResponse> updateFcmToken(@RequestParam String token) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        EmployeeEntity emp = employeeService.getEmployeeByEmailId(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        emp.setFcmToken(token);
        employeeRepository.save(emp);
        return ResponseEntity.ok(ApiResponse.success("FCM token updated successfully"));
    }
}
