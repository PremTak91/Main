package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quotation_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quotation_no")
    private String quotationNo;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_number")
    private String customerNumber;

    private Double kw;

    @Column(name = "solar_type")
    private String solarType;

    @Column(name = "panels_name")
    private String panelsName;

    @Column(name = "effective_price")
    private Double effectivePrice;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(name = "submitted_number")
    private String submittedNumber;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "created_by_name")
    private String createdByName;

    private Long discount;

    @Column(name = "pdf_format")
    private String pdfFormat;

    // Helper columns for full regeneration
    @Column(name = "rate_kw")
    private Double rateKw;

    @Column(name = "discom_meter")
    private String discomMeter;

    @Column(name = "pq_hs_cost")
    private Double pqHsCost;

    private Double subsidy;

    @Column(name = "panel_watt")
    private Integer panelWatt;

    @Column(name = "no_of_panels")
    private Integer noOfPanels;
}
