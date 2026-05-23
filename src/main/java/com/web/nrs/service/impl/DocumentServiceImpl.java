package com.web.nrs.service.impl;

import com.web.nrs.entity.DocumentEntity;
import com.web.nrs.repository.DocumentRepository;
import com.web.nrs.service.CloudinaryStorageService;
import com.web.nrs.service.DocumentService;
import com.web.nrs.utils.PaginationUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentServiceImpl implements DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private CloudinaryStorageService cloudinaryStorageService;

    @Override
    public DocumentEntity saveDocument(String name, MultipartFile file) {
        try {
            // Upload the file to Cloudinary with resource_type="raw"
            java.util.Map<String, String> uploadResult = cloudinaryStorageService.uploadDocument("nrs_documents", file);
            String publicId = uploadResult.get("public_id");
            String url = uploadResult.get("url");

            DocumentEntity document = new DocumentEntity(name, url, publicId);
            return documentRepository.save(document);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save document: " + e.getMessage());
        }
    }

    @Override
    public void deleteDocument(Long id) {
        DocumentEntity document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with ID: " + id));

        try {
            // Delete the raw document from Cloudinary
            cloudinaryStorageService.deleteDocument(document.getPublicId());
            documentRepository.delete(document);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete document: " + e.getMessage());
        }
    }

    @Override
    public Page<DocumentEntity> getAllDocuments(int page, int size, String keyword, String sortBy, String sortDir) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        if (keyword != null && !keyword.trim().isEmpty()) {
            return documentRepository.findByNameContainingIgnoreCase(keyword, pageable);
        }
        return documentRepository.findAll(pageable);
    }
}
