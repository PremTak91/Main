package com.web.nrs.service;

import com.web.nrs.entity.SiteDetailsEntity;
import com.web.nrs.entity.SitePhotoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

public interface SiteService {
    Page<SiteDetailsEntity> getAllSites(String keyword, java.time.LocalDate startDate, java.time.LocalDate endDate, Pageable pageable);
    
    Optional<SiteDetailsEntity> getSiteById(Long id);
    
    SiteDetailsEntity saveSite(SiteDetailsEntity siteDetails, Long userId);
    
    SiteDetailsEntity updateSite(Long id, SiteDetailsEntity siteDetails, Long userId);
    
    boolean deleteSite(Long id);

    // Photos
    List<SitePhotoEntity> getPhotosBySiteId(Long siteId);
    
    SitePhotoEntity uploadPhoto(Long siteId, MultipartFile file, Long userId) throws IOException;
    
    boolean deletePhoto(Long photoId);
}
