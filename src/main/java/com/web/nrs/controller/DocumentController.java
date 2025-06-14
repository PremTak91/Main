package com.web.nrs.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.core.io.ClassPathResource; // Import for ClassPathResource
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpServletRequest; // Use jakarta.servlet.http

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Controller
public class DocumentController {

	@GetMapping("/document")
	public String homePage() {
		return "companyDoc";
	}
	
    @GetMapping("/download-hr-policy")
    public ResponseEntity<Resource> downloadStaticPolicy(HttpServletRequest request) {
        String filename = "NRS_Company_Policy_2025.pdf"; // The actual file name in resources
        String resourcePath = "static/documents/" + filename; // Path within src/main/resources

        try {
            Resource resource = new ClassPathResource(resourcePath);

            if (!resource.exists()) {
                return ResponseEntity.notFound().build(); // File not found in resources
            }

            // Determine content type
            String contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
            if (contentType == null) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE; // Fallback if MIME type not determined
            }

            // Build the response
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (IOException e) {
            // Log the exception
            e.printStackTrace();
            return ResponseEntity.internalServerError().build(); // Internal server error if something goes wrong
        }
    }

}
