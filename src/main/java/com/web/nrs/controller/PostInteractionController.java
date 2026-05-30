package com.web.nrs.controller;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.PostActivityEntity;
import com.web.nrs.entity.PostCommentEntity;
import com.web.nrs.entity.PostLikeEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.repository.PostActivityRepository;
import com.web.nrs.repository.PostCommentRepository;
import com.web.nrs.repository.PostLikeRepository;
import com.web.nrs.utils.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

import com.web.nrs.notification.service.NotificationService;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostInteractionController {

    private final PostActivityRepository postActivityRepository;
    private final EmployeeRepository employeeRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final NotificationService notificationService;

    @PostMapping("/{postId}/like")
    public ResponseEntity<ApiResponse> toggleLike(@PathVariable Long postId, Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> empOpt = employeeRepository.findEmployeeByEmail(email);
        
        if (empOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
        }
        
        Long empId = empOpt.get().getId();
        PostActivityEntity post = postActivityRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
                
        Optional<PostLikeEntity> existingLike = postLikeRepository.findByPostIdAndEmployeeId(postId, empId);
        
        if (existingLike.isPresent()) {
            // Unlike
            postLikeRepository.delete(existingLike.get());
            long newCount = postLikeRepository.countByPostId(postId);
            return ResponseEntity.ok(ApiResponse.success("Unliked", Map.of("liked", false, "likeCount", newCount)));
        } else {
            // Like
            PostLikeEntity newLike = PostLikeEntity.builder()
                    .post(post)
                    .employee(empOpt.get())
                    .build();
            postLikeRepository.save(newLike);
            long newCount = postLikeRepository.countByPostId(postId);
            
            // Notify post author
            if (!post.getEmpId().equals(empId)) {
                String authorName = empOpt.get().getFirstName() + " " + (empOpt.get().getLastName() != null ? empOpt.get().getLastName() : "");
                String message = authorName + " liked your post.";
                notificationService.createAndSendNotification("LIKE", "New Like", message, "/NRS/home#post-" + post.getId(), java.util.List.of(post.getEmpId()));
            }
            
            return ResponseEntity.ok(ApiResponse.success("Liked", Map.of("liked", true, "likeCount", newCount)));
        }
    }

    @PostMapping("/{postId}/comment")
    public ResponseEntity<ApiResponse> addComment(@PathVariable Long postId, @RequestBody Map<String, String> request, Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> empOpt = employeeRepository.findEmployeeByEmail(email);
        
        if (empOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("User not found"));
        }
        
        String commentText = request.get("text");
        if (commentText == null || commentText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Comment text cannot be empty"));
        }
        
        PostActivityEntity post = postActivityRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
                
        PostCommentEntity comment = PostCommentEntity.builder()
                .post(post)
                .employee(empOpt.get())
                .commentText(commentText)
                .createdAt(java.time.LocalDateTime.now())
                .build();
                
        postCommentRepository.save(comment);
        
        // Return author info so JS can append it
        String authorName = empOpt.get().getFirstName() + " " + (empOpt.get().getLastName() != null ? empOpt.get().getLastName() : "");
        
        // Notify logic
        if (commentText.toLowerCase().contains("@all")) {
            String message = authorName + " mentioned everyone in a comment.";
            
            java.util.List<Long> allEmpIds = employeeRepository.findAll().stream()
                    .map(EmployeeEntity::getId)
                    .filter(id -> !id.equals(empOpt.get().getId()))
                    .collect(java.util.stream.Collectors.toList());
                    
            notificationService.createAndSendNotification("MENTION", "New Mention", message, "/NRS/home#post-" + post.getId(), allEmpIds);
        } else if (!post.getEmpId().equals(empOpt.get().getId())) {
            String message = authorName + " commented on your post.";
            notificationService.createAndSendNotification("COMMENT", "New Comment", message, "/NRS/home#post-" + post.getId(), java.util.List.of(post.getEmpId()));
        }
        
        java.util.Map<String, Object> responseData = new java.util.HashMap<>();
        responseData.put("id", comment.getId() != null ? comment.getId() : 0L);
        responseData.put("text", comment.getCommentText());
        responseData.put("authorName", authorName);
        responseData.put("authorPhoto", empOpt.get().getPhoto() != null ? empOpt.get().getPhoto() : "");
        
        return ResponseEntity.ok(ApiResponse.success("Comment added", responseData));
    }
}
