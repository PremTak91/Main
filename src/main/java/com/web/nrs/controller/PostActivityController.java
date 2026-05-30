package com.web.nrs.controller;

import com.web.nrs.utils.ApiResponse;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.service.PostActivityService;
import com.web.nrs.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Controller
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostActivityController {

    private final PostActivityService postActivityService;
    private final com.web.nrs.service.EmployeeService employeeService;
    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;

    @PostMapping
    @ResponseBody
    public ResponseEntity<ApiResponse> createPost(
            @RequestParam(value = "postText", required = false) String postText,
            @RequestParam(value = "postImage", required = false) MultipartFile postImage) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            EmployeeEntity emp = employeeService.getEmployeeByEmailId(email)
                    .orElseThrow(() -> new RuntimeException("Logged in employee not found"));

            var post = postActivityService.savePost(emp.getId(), postText, postImage);

            if (postText != null && postText.toLowerCase().contains("@all")) {
                String authorName = emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : "");
                String message = authorName + " mentioned everyone in a new post.";
                
                java.util.List<Long> allEmpIds = employeeRepository.findAll().stream()
                        .map(EmployeeEntity::getId)
                        .filter(id -> !id.equals(emp.getId()))
                        .collect(java.util.stream.Collectors.toList());
                        
                notificationService.createAndSendNotification("MENTION", "New Mention", message, "/NRS/home#post-" + post.getId(), allEmpIds);
            }

            return ResponseEntity.ok(ApiResponse.success("Post created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to create post: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> updatePost(
            @PathVariable Long id,
            @RequestParam(value = "postText", required = false) String postText,
            @RequestParam(value = "postImage", required = false) MultipartFile postImage) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            EmployeeEntity emp = employeeService.getEmployeeByEmailId(email)
                    .orElseThrow(() -> new RuntimeException("Logged in employee not found"));
            
            boolean isSuperAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"));
                    
            Long postAuthorId = postActivityService.getPostById(id).getEmpId();
            
            if (!isSuperAdmin && !postAuthorId.equals(emp.getId())) {
                return ResponseEntity.status(403).body(ApiResponse.error("You don't have permission to edit this post"));
            }

            postActivityService.updatePost(id, postText, postImage);
            return ResponseEntity.ok(ApiResponse.success("Post updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update post: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> getPost(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Post fetched", postActivityService.getPostById(id)));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Post not found"));
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> deletePost(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            EmployeeEntity emp = employeeService.getEmployeeByEmailId(email)
                    .orElseThrow(() -> new RuntimeException("Logged in employee not found"));
            
            // Check authorization: only creator or SUPERADMIN can delete
            boolean isSuperAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"));
                    
            Long postAuthorId = postActivityService.getPostById(id).getEmpId();
            
            if (!isSuperAdmin && !postAuthorId.equals(emp.getId())) {
                return ResponseEntity.status(403).body(ApiResponse.error("You don't have permission to delete this post"));
            }

            postActivityService.deletePost(id);
            return ResponseEntity.ok(ApiResponse.success("Post deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete post: " + e.getMessage()));
        }
    }
}
