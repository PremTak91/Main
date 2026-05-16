package com.web.nrs.scheduler;

import com.web.nrs.entity.SitePhotoEntity;
import com.web.nrs.repository.SitePhotoRepository;
import com.web.nrs.service.CloudinaryStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SiteScheduler {

    private final SitePhotoRepository sitePhotoRepository;
    private final CloudinaryStorageService cloudinaryStorageService;

    // Run every day at Midnight (00:00:00)
    @Scheduled(cron = "0 0 0 * * ?")
    public void cleanupOldSitePhotos() {
        log.info("Starting midnight cleanup of old site photos...");
        
        // Photos older than 30 days
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        
        List<SitePhotoEntity> oldPhotos = sitePhotoRepository.findByUploadedAtBefore(cutoffDate);
        
        int count = 0;
        for (SitePhotoEntity photo : oldPhotos) {
            try {
                // Delete from Cloudinary
                cloudinaryStorageService.deleteImage(photo.getObjectKey());
                // Delete from Database
                sitePhotoRepository.delete(photo);
                count++;
            } catch (Exception e) {
                log.error("Failed to delete old photo: {}", photo.getObjectKey(), e);
            }
        }
        
        log.info("Cleanup finished. Deleted {} old site photos.", count);
    }
}
