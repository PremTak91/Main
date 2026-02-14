package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "inquiry")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InquiryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @Column(name = "contact_no")
    private String contactNo;

    @Column(name = "address")
    private String address;

    @Column(name = "given_by_id")
    private Long givenById;

    @Column(name = "given_by_name")
    private String givenByName;

    @Column(name = "inquiry_history", columnDefinition = "TEXT")
    private String inquiryHistory;

    @Column(name = "inquiry_date")
    private LocalDate inquiryDate;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
