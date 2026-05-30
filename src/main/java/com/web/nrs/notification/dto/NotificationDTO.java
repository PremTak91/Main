package com.web.nrs.notification.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class NotificationDTO {
    private String id;
    private String typeCode;
    private String title;
    private String message;
    private String deepLink;
    private String priority;
    private Boolean actionRequired;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
