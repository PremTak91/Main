package com.web.nrs.service.impl;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.PostActivityEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.repository.PostActivityRepository;
import com.web.nrs.repository.PostCommentRepository;
import com.web.nrs.repository.PostLikeRepository;
import com.web.nrs.service.PostActivityService;
import com.web.nrs.utils.ConstantUtils;
import com.web.nrs.entity.PostLikeEntity;
import com.web.nrs.entity.PostCommentEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostActivityServiceImpl implements PostActivityService {

    private final PostActivityRepository postActivityRepository;
    private final EmployeeRepository employeeRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;

    @Override
    public List<Map<String, Object>> getAllPostsWithEmployeeDetails(Long currentUserId) {
        List<PostActivityEntity> posts = postActivityRepository.findAllByOrderByAuditTimeStampDesc();
        return posts.stream().map(post -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", post.getId());
            map.put("empId", post.getEmpId());
            map.put("postText", post.getPostText());
            map.put("postImage", post.getPostImage());
            map.put("auditTimeStamp", post.getAuditTimeStamp().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")));
            
            employeeRepository.findById(post.getEmpId()).ifPresent(emp -> {
                map.put("authorName", emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : ""));
                map.put("authorPhoto", emp.getPhoto());
            });
            
            // Likes
            long likeCount = postLikeRepository.countByPostId(post.getId());
            boolean likedByMe = currentUserId != null && postLikeRepository.existsByPostIdAndEmployeeId(post.getId(), currentUserId);
            
            List<PostLikeEntity> allLikes = postLikeRepository.findAllByPostIdOrderByCreatedAtDesc(post.getId());
            List<String> likerNames = allLikes.stream()
                .map(like -> like.getEmployee().getFirstName() + " " + (like.getEmployee().getLastName() != null ? like.getEmployee().getLastName() : ""))
                .collect(Collectors.toList());
                
            map.put("likeCount", likeCount);
            map.put("likedByMe", likedByMe);
            map.put("likerNames", likerNames);
            
            // Comments
            List<PostCommentEntity> allComments = postCommentRepository.findAllByPostIdOrderByCreatedAtAsc(post.getId());
            List<Map<String, Object>> commentList = allComments.stream().map(c -> {
                Map<String, Object> cmap = new HashMap<>();
                cmap.put("id", c.getId());
                cmap.put("text", c.getCommentText());
                cmap.put("authorName", c.getEmployee().getFirstName() + " " + (c.getEmployee().getLastName() != null ? c.getEmployee().getLastName() : ""));
                cmap.put("authorPhoto", c.getEmployee().getPhoto());
                cmap.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM, hh:mm a")) : "Just now");
                return cmap;
            }).collect(Collectors.toList());
            
            map.put("commentCount", commentList.size());
            map.put("comments", commentList);
            
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public void savePost(Long empId, String postText, MultipartFile postImage) throws Exception {
        String fileName = null;
        if (postImage != null && !postImage.isEmpty()) {
            fileName = UUID.randomUUID().toString() + "_" + postImage.getOriginalFilename();
            uploadImage(postImage, fileName);
        }

        PostActivityEntity post = PostActivityEntity.builder()
                .empId(empId)
                .postText(postText)
                .postImage(fileName)
                .build();

        postActivityRepository.save(post);
    }

    @Override
    public void updatePost(Long id, String postText, MultipartFile postImage) throws Exception {
        PostActivityEntity post = getPostById(id);
        post.setPostText(postText);

        if (postImage != null && !postImage.isEmpty()) {
            // Delete old image if exists
            if (post.getPostImage() != null) {
                Path oldPath = Paths.get(ConstantUtils.POST_IMAGE_PATH + post.getPostImage());
                Files.deleteIfExists(oldPath);
            }
            
            String fileName = UUID.randomUUID().toString() + "_" + postImage.getOriginalFilename();
            uploadImage(postImage, fileName);
            post.setPostImage(fileName);
        }

        postActivityRepository.save(post);
    }

    @Override
    public PostActivityEntity getPostById(Long id) {
        return postActivityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));
    }

    private void uploadImage(MultipartFile file, String fileName) throws Exception {
        Path uploadPath = Paths.get(ConstantUtils.POST_IMAGE_PATH);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);
    }

    @Override
    public void deletePost(Long id) throws Exception {
        PostActivityEntity post = getPostById(id);
        
        // Delete image file if exists
        if (post.getPostImage() != null) {
            Path imagePath = Paths.get(ConstantUtils.POST_IMAGE_PATH + post.getPostImage());
            Files.deleteIfExists(imagePath);
        }
        
        // Dependencies like PostLike and PostComment need to be deleted manually if no cascade
        // We will fetch them and delete them first
        List<PostLikeEntity> likes = postLikeRepository.findAllByPostIdOrderByCreatedAtDesc(id);
        postLikeRepository.deleteAll(likes);
        
        List<PostCommentEntity> comments = postCommentRepository.findAllByPostIdOrderByCreatedAtAsc(id);
        postCommentRepository.deleteAll(comments);

        postActivityRepository.delete(post);
    }
}
