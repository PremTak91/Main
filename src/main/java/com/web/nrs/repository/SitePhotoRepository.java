package com.web.nrs.repository;

import com.web.nrs.entity.SitePhotoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SitePhotoRepository extends JpaRepository<SitePhotoEntity, Long> {
    List<SitePhotoEntity> findBySiteId(Long siteId);
    
    // For midnight cleanup scheduler
    List<SitePhotoEntity> findByUploadedAtBefore(LocalDateTime cutoffDate);
}
