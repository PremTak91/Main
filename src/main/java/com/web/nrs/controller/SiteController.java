package com.web.nrs.controller;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.SiteDetailsEntity;
import com.web.nrs.entity.SitePhotoEntity;
import com.web.nrs.service.EmployeeService;
import com.web.nrs.service.CloudinaryStorageService;
import com.web.nrs.service.SiteService;
import com.web.nrs.utils.ApiResponse;
import com.web.nrs.utils.PaginationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/sites")
@RequiredArgsConstructor
public class SiteController {

    private final SiteService siteService;
    private final EmployeeService employeeService;
    private final CloudinaryStorageService cloudinaryStorageService;

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        return employeeService.getEmployeeByEmailId(email)
                .map(EmployeeEntity::getId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @GetMapping
    public String viewSiteManagement(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            Model model
    ) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<SiteDetailsEntity> sitePage = siteService.getAllSites(keyword, startDate, endDate, pageable);

        model.addAttribute("sites", sitePage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", sitePage.getTotalPages());
        model.addAttribute("totalItems", sitePage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");
        model.addAttribute("keyword", keyword);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);

        // Fetch technicians for the dropdown (assuming role 'technician' or all employees)
        // For now, pass all employees or a specific list
        model.addAttribute("employees", employeeService.getAllEmployees(Pageable.unpaged()).getContent());

        return "site-list";
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> getSiteById(@PathVariable Long id) {
        return siteService.getSiteById(id)
                .map(site -> ResponseEntity.ok(ApiResponse.success("Site found", site)))
                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Site not found")));
    }

    @PostMapping("/save")
    @ResponseBody
    public ResponseEntity<ApiResponse> saveOrUpdateSite(
            @ModelAttribute SiteDetailsEntity siteDetails,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            if (siteDetails.getId() == null) {
                siteService.saveSite(siteDetails, userId);
            } else {
                siteService.updateSite(siteDetails.getId(), siteDetails, userId);
            }
            return ResponseEntity.ok(ApiResponse.success("Site saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> deleteSite(@PathVariable Long id) {
        try {
            boolean deleted = siteService.deleteSite(id);
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.success("Site deleted successfully"));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete site"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // --- PHOTO MANAGEMENT ---

    @GetMapping("/{id}/photos")
    @ResponseBody
    public ResponseEntity<ApiResponse> getSitePhotos(@PathVariable Long id) {
        try {
            List<SitePhotoEntity> photos = siteService.getPhotosBySiteId(id);
            
            // Generate static URLs for viewing
            List<Map<String, Object>> photoData = photos.stream().map(photo -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", photo.getId());
                map.put("originalFilename", photo.getOriginalFilename());
                map.put("uploadedAt", photo.getUploadedAt());
                map.put("url", cloudinaryStorageService.generateUrl(photo.getObjectKey()));
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Photos fetched", photoData));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/photos")
    @ResponseBody
    public ResponseEntity<ApiResponse> uploadSitePhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            Long userId = getUserId(authentication);
            siteService.uploadPhoto(id, file, userId);
            return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/photos/{photoId}")
    @ResponseBody
    public ResponseEntity<ApiResponse> deleteSitePhoto(@PathVariable Long photoId) {
        try {
            boolean deleted = siteService.deletePhoto(photoId);
            if (deleted) {
                return ResponseEntity.ok(ApiResponse.success("Photo deleted successfully"));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete photo"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
