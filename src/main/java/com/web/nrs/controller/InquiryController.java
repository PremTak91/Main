package com.web.nrs.controller;

import com.web.nrs.entity.InquiryEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.service.InquiryService;
import com.web.nrs.utils.ApiResponse;
import com.web.nrs.utils.PaginationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;

@Controller
@RequestMapping("/inquiry")
@RequiredArgsConstructor
@PreAuthorize("!hasRole('DEALER')")
public class InquiryController {

    private final InquiryService inquiryService;
    private final EmployeeRepository employeeRepository;
    private final com.web.nrs.service.EmployeeService employeeService;

    @GetMapping
    public String viewInquiryPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Model model
    ) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        
        // Security check
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));
        
        Long employeeId = employeeService.getEmployeeByEmailId(auth.getName())
                    .map(com.web.nrs.entity.EmployeeEntity::getId)
                    .orElse(0L);

        Page<InquiryEntity> inquiryPage;
        if (isAdmin) {
            inquiryPage = inquiryService.getAllInquiries(pageable);
        } else {
            // Non-admin can only see their own entries from today
            inquiryPage = inquiryService.getInquiriesByCreatorAndDate(employeeId, LocalDate.now().atStartOfDay(), pageable);
        }

        // Load active employees for "Given By" dropdown
        model.addAttribute("isAdmin", isAdmin);
        model.addAttribute("currentEmployeeId", employeeId);
        model.addAttribute("today", LocalDate.now());
        List<Map<String, Object>> employeeList = employeeRepository.findAll().stream()
                .filter(emp -> emp.getEmpStatus() != null && emp.getEmpStatus() == 1)
                .map(emp -> {
                    Map<String, Object> empMap = new HashMap<>();
                    empMap.put("id", emp.getId());
                    empMap.put("name", emp.getFullName());
                    return empMap;
                })
                .filter(m -> m.get("name") != null && !m.get("name").toString().isBlank())
                .collect(Collectors.toList());

        model.addAttribute("inquiries", inquiryPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", inquiryPage.getTotalPages());
        model.addAttribute("totalItems", inquiryPage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");
        model.addAttribute("employees", employeeList);

        return "inquiryEntry";
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> getInquiryById(@PathVariable Long id) {
        try {
            InquiryEntity inquiry = inquiryService.getInquiryById(id);
            return ResponseEntity.ok(ApiResponse.success("Inquiry fetched", inquiry));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Inquiry not found"));
        }
    }

    @PostMapping
    @ResponseBody
    public ResponseEntity<ApiResponse> createInquiry(@RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long employeeId = employeeService.getEmployeeByEmailId(auth.getName())
                    .map(com.web.nrs.entity.EmployeeEntity::getId)
                    .orElseThrow(() -> new RuntimeException("Logged in employee not found"));

            InquiryEntity inquiry = mapRequestToEntity(request, new InquiryEntity());
            inquiry.setCreatedBy(employeeId);
            inquiryService.saveInquiry(inquiry);
            return ResponseEntity.ok(ApiResponse.success("Inquiry added successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> updateInquiry(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));
            
            InquiryEntity existing = inquiryService.getInquiryById(id);
            
            if (!isAdmin) {
                Long employeeId = employeeService.getEmployeeByEmailId(auth.getName())
                        .map(com.web.nrs.entity.EmployeeEntity::getId)
                        .orElse(0L);
                
                // Only allow edit if it's their own entry and it was created today
                if (!existing.getCreatedBy().equals(employeeId)) {
                    return ResponseEntity.status(403).body(ApiResponse.error("You can only edit your own entries"));
                }
                if (existing.getCreatedAt().toLocalDate().isBefore(LocalDate.now())) {
                    return ResponseEntity.status(403).body(ApiResponse.error("You can only edit entries on the same day they were created"));
                }
            }
            
            mapRequestToEntity(request, existing);
            inquiryService.saveInquiry(existing);
            return ResponseEntity.ok(ApiResponse.success("Inquiry updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> deleteInquiry(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));
            
            if (!isAdmin) {
                return ResponseEntity.status(403).body(ApiResponse.error("Only administrators can delete entries"));
            }
            
            inquiryService.deleteInquiry(id);
            return ResponseEntity.ok(ApiResponse.success("Inquiry deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private InquiryEntity mapRequestToEntity(Map<String, Object> request, InquiryEntity inquiry) {
        if (request.containsKey("name")) {
            inquiry.setName(request.get("name").toString());
        }
        if (request.containsKey("contactNo")) {
            inquiry.setContactNo(request.get("contactNo").toString());
        }
        if (request.containsKey("address")) {
            inquiry.setAddress(request.get("address").toString());
        }
        if (request.containsKey("givenById") && request.get("givenById") != null
                && !request.get("givenById").toString().isEmpty()) {
            Long empId = Long.valueOf(request.get("givenById").toString());
            inquiry.setGivenById(empId);
            // Look up employee name
            employeeRepository.findById(empId).ifPresent(emp -> {
                inquiry.setGivenByName(emp.getFullName());
            });
        }
        if (request.containsKey("inquiryHistory")) {
            inquiry.setInquiryHistory(request.get("inquiryHistory").toString());
        }
        if (request.containsKey("inquiryDate") && request.get("inquiryDate") != null
                && !request.get("inquiryDate").toString().isEmpty()) {
            inquiry.setInquiryDate(LocalDate.parse(request.get("inquiryDate").toString()));
        }
        if (request.containsKey("status")) {
            inquiry.setStatus(request.get("status").toString());
        }
        return inquiry;
    }
}
