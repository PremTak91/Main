package com.web.nrs.controller;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.service.PostActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostActivityController {

    private final PostActivityService postActivityService;
    private final EmployeeRepository employeeRepository;

    @PostMapping
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createPost(
            @RequestParam(value = "postText", required = false) String postText,
            @RequestParam(value = "postImage", required = false) MultipartFile postImage) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            EmployeeEntity emp = employeeRepository.findEmployeeByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Logged in employee not found"));

            postActivityService.savePost(emp.getId(), postText, postImage);
            
            response.put("success", true);
            response.put("message", "Post created successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to create post: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updatePost(
            @PathVariable Long id,
            @RequestParam(value = "postText", required = false) String postText,
            @RequestParam(value = "postImage", required = false) MultipartFile postImage) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            postActivityService.updatePost(id, postText, postImage);
            
            response.put("success", true);
            response.put("message", "Post updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update post: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Object> getPost(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(postActivityService.getPostById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
