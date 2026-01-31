package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "employeemainter")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeMainterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mainterid")
    private Long mainterId;

    @Column(name = "designationid")
    private Long designationId;

    private Integer active;

    @Column(name = "audituserid")
    private Long auditUserId;

    @Column(name = "audittimestamp")
    private LocalDateTime auditTimestamp;
}
