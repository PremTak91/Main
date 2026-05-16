package com.web.nrs.service.impl;

import com.web.nrs.entity.SiteDetailsEntity;
import com.web.nrs.entity.SitePhotoEntity;
import com.web.nrs.repository.SiteDetailsRepository;
import com.web.nrs.repository.SitePhotoRepository;
import com.web.nrs.service.CloudinaryStorageService;
import com.web.nrs.service.SiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SiteServiceImpl implements SiteService {

    private final SiteDetailsRepository siteDetailsRepository;
    private final SitePhotoRepository sitePhotoRepository;
    private final CloudinaryStorageService cloudinaryStorageService;

    @Override
    public Page<SiteDetailsEntity> getAllSites(String keyword, java.time.LocalDate startDate, java.time.LocalDate endDate, Pageable pageable) {
        LocalDateTime start = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime end = (endDate != null) ? endDate.atTime(23, 59, 59) : null;
        
        return siteDetailsRepository.searchSites(keyword, start, end, pageable);
    }

    @Override
    public Optional<SiteDetailsEntity> getSiteById(Long id) {
        return siteDetailsRepository.findById(id);
    }

    @Override
    @Transactional
    public SiteDetailsEntity saveSite(SiteDetailsEntity siteDetails, Long userId) {
        siteDetails.setCreatedBy(userId);
        siteDetails.setUpdatedBy(userId);
        return siteDetailsRepository.save(siteDetails);
    }

    @Override
    @Transactional
    public SiteDetailsEntity updateSite(Long id, SiteDetailsEntity siteDetails, Long userId) {
        SiteDetailsEntity existing = siteDetailsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Site not found"));

        existing.setCustomerName(siteDetails.getCustomerName());
        existing.setContactNo(siteDetails.getContactNo());
        existing.setAddress(siteDetails.getAddress());
        existing.setSiteStatus(siteDetails.getSiteStatus());
        existing.setAssignedTechnicianId(siteDetails.getAssignedTechnicianId());
        existing.setExpectedCompletedDate(siteDetails.getExpectedCompletedDate());
        existing.setKilowatt(siteDetails.getKilowatt());
        existing.setRemarks(siteDetails.getRemarks());
        existing.setUpdatedBy(userId);

        return siteDetailsRepository.save(existing);
    }

    @Override
    @Transactional
    public boolean deleteSite(Long id) {
        if (siteDetailsRepository.existsById(id)) {
            // Delete associated photos from Cloudinary
            List<SitePhotoEntity> photos = sitePhotoRepository.findBySiteId(id);
            for (SitePhotoEntity photo : photos) {
                cloudinaryStorageService.deleteImage(photo.getObjectKey());
            }
            siteDetailsRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    public List<SitePhotoEntity> getPhotosBySiteId(Long siteId) {
        return sitePhotoRepository.findBySiteId(siteId);
    }

    @Override
    @Transactional
    public SitePhotoEntity uploadPhoto(Long siteId, MultipartFile file, Long userId) throws IOException {
        SiteDetailsEntity site = siteDetailsRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found"));

        // Format: Site Photos/Customer Name/Photos
        String folderName = "Site Photos/" + site.getCustomerName() + "/Photos";
        
        String objectKey = cloudinaryStorageService.compressAndUploadImage(folderName, file);

        SitePhotoEntity photoEntity = SitePhotoEntity.builder()
                .siteId(siteId)
                .objectKey(objectKey)
                .originalFilename(file.getOriginalFilename())
                .uploadedBy(userId)
                .uploadedAt(LocalDateTime.now())
                .build();

        return sitePhotoRepository.save(photoEntity);
    }

    @Override
    @Transactional
    public boolean deletePhoto(Long photoId) {
        return sitePhotoRepository.findById(photoId).map(photo -> {
            cloudinaryStorageService.deleteImage(photo.getObjectKey());
            sitePhotoRepository.delete(photo);
            return true;
        }).orElse(false);
    }
}
