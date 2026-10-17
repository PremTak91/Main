package com.web.nrs.controller;

import com.web.nrs.config.TenantContext;
import com.web.nrs.entity.CompanyEntity;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.repository.CompanyRepository;
import com.web.nrs.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.net.URI;
import java.time.Year;
import java.util.Optional;

@Controller
public class HrPolicyController {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @GetMapping("/download-hr-policy")
    public ResponseEntity<?> downloadHrPolicy() {
        CompanyEntity company = null;
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            company = companyRepository.findById(tenantId).orElse(null);
        }
        if (company == null) {
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                    Optional<EmployeeEntity> empOpt = employeeRepository.findEmployeeByEmail(auth.getName());
                    if (empOpt.isPresent() && empOpt.get().getCompanyId() != null) {
                        company = companyRepository.findById(empOpt.get().getCompanyId()).orElse(null);
                    }
                }
            } catch (Exception ignored) {}
        }

        // If company has a custom policy document URL (e.g. Cloudinary)
        if (company != null && company.getPolicyDoc() != null && !company.getPolicyDoc().trim().isEmpty()) {
            String policyUrl = company.getPolicyDoc().trim();
            if (policyUrl.startsWith("http://") || policyUrl.startsWith("https://")) {
                return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(policyUrl)).build();
            } else {
                try {
                    String cleanPath = policyUrl.startsWith("/") ? policyUrl.substring(1) : policyUrl;
                    Resource customRes = new ClassPathResource(cleanPath);
                    if (customRes.exists()) {
                        String compName = company.getName() != null ? company.getName().replaceAll("[^a-zA-Z0-9_-]", "_") : "Company";
                        String fileName = compName + "_Policy_" + Year.now().getValue() + ".pdf";
                        return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                                .body(customRes);
                    }
                } catch (Exception ignored) {}
            }
        }

        // Fallback to default company policy document
        Resource resource = new ClassPathResource("static/documents/NRS_Company_Policy_2025.pdf");
        String compName = (company != null && company.getName() != null) ? company.getName().replaceAll("[^a-zA-Z0-9_-]", "_") : "NRS";
        String fileName = compName + "_Company_Policy_" + Year.now().getValue() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
