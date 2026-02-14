package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_activity")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "emp_id", nullable = false)
    private Long empId;

    @Column(name = "post_text", columnDefinition = "TEXT")
    private String postText;

    @Column(name = "post_image")
    private String postImage;

    @Column(name = "audit_time_stamp")
    private LocalDateTime auditTimeStamp;

    @PrePersist
    protected void onCreate() {
        auditTimeStamp = LocalDateTime.now();
    }
}
