package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "site_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteDetailsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "contact_no")
    private String contactNo;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "site_status")
    private String siteStatus; // e.g., Pending, In Progress, Completed

    @Column(name = "assigned_technician_id")
    private Long assignedTechnicianId;

    @Column(name = "expected_completed_date")
    private LocalDate expectedCompletedDate;

    @Column(name = "kilowatt")
    private String kilowatt;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "siteId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SitePhotoEntity> photos;

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
