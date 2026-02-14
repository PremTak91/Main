package com.web.nrs.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.Year;

@Controller
public class HrPolicyController {

    @GetMapping("/download-hr-policy")
    public ResponseEntity<Resource> downloadHrPolicy() {
        Resource resource = new ClassPathResource("static/documents/NRS_Company_Policy_2025.pdf");
        String fileName = "NRS_Company_Policy_" + Year.now().getValue() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
