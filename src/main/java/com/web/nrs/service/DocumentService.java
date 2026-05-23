package com.web.nrs.service;

import com.web.nrs.entity.DocumentEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentService {
    
    DocumentEntity saveDocument(String name, MultipartFile file);
    
    void deleteDocument(Long id);
    
    Page<DocumentEntity> getAllDocuments(int page, int size, String keyword, String sortBy, String sortDir);
    
}
