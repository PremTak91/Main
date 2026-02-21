package com.web.nrs.controller;

import com.web.nrs.utils.ApiResponse;
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

import java.util.Map;

@Controller
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostActivityController {

    private final PostActivityService postActivityService;
    private final EmployeeRepository employeeRepository;

    @PostMapping
    @ResponseBody
    public ResponseEntity<ApiResponse> createPost(
            @RequestParam(value = "postText", required = false) String postText,
            @RequestParam(value = "postImage", required = false) MultipartFile postImage) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            EmployeeEntity emp = employeeRepository.findEmployeeByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Logged in employee not found"));

            postActivityService.savePost(emp.getId(), postText, postImage);
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
}
