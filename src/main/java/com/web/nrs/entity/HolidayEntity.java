package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "holidays")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HolidayEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "holiday_id")
    private Long holidayId;

    @Column(name = "holiday_name")
    private String holidayName;

    @Column(name = "holiday_date")
    private LocalDate holidayDate;

    private Integer year;

    @Column(name = "day_name")
    private String dayName;

    @Column(name = "holiday_type")
    private String holidayType;

    private String description;

    @Column(name = "is_optional")
    private Boolean isOptional;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
