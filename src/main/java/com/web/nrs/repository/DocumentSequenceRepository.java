package com.web.nrs.repository;

import com.web.nrs.entity.DocumentSequenceEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface DocumentSequenceRepository extends JpaRepository<DocumentSequenceEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
       SELECT d FROM DocumentSequenceEntity d
       WHERE d.docType = :docType
       AND d.financialYear = :fy
       """)
    DocumentSequenceEntity getSequenceForUpdate(String docType, String fy);

    @Modifying
    @Transactional
    @Query(value = """
        UPDATE document_sequence
        SET last_number = :sequence
        WHERE doc_type = :docType
        AND financial_year = :fy
        """, nativeQuery = true)
    void incrementSequence(String docType, String fy, String sequence);


    @Query(value = "SELECT LAST_INSERT_ID()", nativeQuery = true)
    Integer getLastInsertedId();

}
