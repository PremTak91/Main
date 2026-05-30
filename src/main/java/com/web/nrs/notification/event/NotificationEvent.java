package com.web.nrs.notification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.List;

@Getter
public class NotificationEvent extends ApplicationEvent {
    
    private final String typeCode;
    private final String title;
    private final String message;
    private final String deepLink;
    private final List<Long> recipientIds;

    public NotificationEvent(Object source, String typeCode, String title, String message, String deepLink, List<Long> recipientIds) {
        super(source);
        this.typeCode = typeCode;
        this.title = title;
        this.message = message;
        this.deepLink = deepLink;
        this.recipientIds = recipientIds;
    }
}
