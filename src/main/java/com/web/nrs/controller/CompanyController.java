package com.web.nrs.controller;

import com.web.nrs.entity.CompanyEntity;
import com.web.nrs.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import java.util.List;
import com.web.nrs.repository.CompanyRepository;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private com.web.nrs.service.CompanyModuleService companyModuleService;

    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public List<CompanyEntity> getAllCompanies(@RequestParam(required = false, defaultValue = "false") boolean includeDeleted) {
        if (includeDeleted) {
            return companyRepository.findAll();
        }
        return companyRepository.findByDeletedFalse();
    }

    // SuperAdmin only
    @Autowired
    private com.web.nrs.service.CloudinaryStorageService cloudinaryStorageService;

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> createCompany(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String adminEmail = request.get("adminEmail");
        String adminPassword = request.get("adminPassword");

        if (name == null || adminEmail == null || adminPassword == null) {
            return ResponseEntity.badRequest().body("Name, adminEmail, and adminPassword are required");
        }

        CompanyEntity company = companyService.createCompany(request);
        return ResponseEntity.ok(company);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> updateCompany(@PathVariable Long id, @RequestBody Map<String, String> request) {
        CompanyEntity company = companyService.updateCompany(id, request);
        return ResponseEntity.ok(company);
    }

    @PostMapping("/{id}/logo")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> uploadLogo(@PathVariable Long id, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            String objectKey = cloudinaryStorageService.compressAndUploadImage("company_logos", file);
            String logoUrl = cloudinaryStorageService.generateUrl(objectKey);
            java.util.Map<String, String> map = new java.util.HashMap<>();
            map.put("logo", logoUrl);
            companyService.updateCompany(id, map);
            return ResponseEntity.ok(java.util.Map.of("logoUrl", logoUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to upload logo: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/policy")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> uploadPolicyDocument(@PathVariable Long id, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            java.util.Map<String, String> uploadResult = cloudinaryStorageService.uploadDocument("company_policies", file);
            String policyUrl = uploadResult.get("url");
            java.util.Map<String, String> map = new java.util.HashMap<>();
            map.put("policyDoc", policyUrl);
            companyService.updateCompany(id, map);
            return ResponseEntity.ok(java.util.Map.of("policyUrl", policyUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to upload policy document: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/dashboard")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> getCompanyDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getCompanyDashboard(id));
    }

    @PutMapping("/{id}/subscription")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> updateSubscription(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String planExtension = request.get("planExtension");
        String customEndDate = request.get("customEndDate");
        String status = request.get("status");
        
        companyService.updateSubscription(id, planExtension, customEndDate, status);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/modules")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> updateModules(@PathVariable Long id, @RequestBody Map<String, Boolean> moduleUpdates) {
        companyModuleService.updateModules(id, moduleUpdates);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        companyService.updateCompany(id, null, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        companyService.softDeleteCompany(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<?> restoreCompany(@PathVariable Long id) {
        companyService.restoreCompany(id);
        return ResponseEntity.ok().build();
    }
}
