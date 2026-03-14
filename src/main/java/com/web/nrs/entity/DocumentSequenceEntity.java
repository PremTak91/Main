package com.web.nrs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_sequence")
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(DocumentSequenceId.class)
@Access(AccessType.FIELD)
public class DocumentSequenceEntity {
    @Id
    @Column(name="doc_type")
    private String docType;
    @Id
    @Column(name="financial_year")
    private String financialYear;
    @Column(name="last_number")
    private Integer lastNumber;
}
