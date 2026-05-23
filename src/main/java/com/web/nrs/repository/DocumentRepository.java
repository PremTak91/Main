package com.web.nrs.repository;

import com.web.nrs.entity.DocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentEntity, Long> {
    
    Page<DocumentEntity> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
}
