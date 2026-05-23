package com.web.nrs.controller;

import com.web.nrs.entity.DocumentEntity;
import com.web.nrs.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/admin/documents")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @GetMapping
    public String getDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword,
            Model model) {

        Page<DocumentEntity> documentPage = documentService.getAllDocuments(page, size, keyword, sortBy, sortDir);
        
        model.addAttribute("documents", documentPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", documentPage.getTotalPages());
        model.addAttribute("totalItems", documentPage.getTotalElements());
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("keyword", keyword);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");
        
        return "document-list";
    }

    @PostMapping("/upload")
    public String uploadDocument(
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file,
            RedirectAttributes redirectAttributes) {
        
        try {
            if (file.isEmpty()) {
                redirectAttributes.addFlashAttribute("errorMessage", "Please select a file to upload.");
                return "redirect:/admin/documents";
            }
            
            documentService.saveDocument(name, file);
            redirectAttributes.addFlashAttribute("successMessage", "Document uploaded successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Failed to upload document: " + e.getMessage());
        }
        
        return "redirect:/admin/documents";
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public Map<String, Object> deleteDocument(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            documentService.deleteDocument(id);
            response.put("success", true);
            response.put("message", "Document deleted successfully!");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }
        return response;
    }
}
