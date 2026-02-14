package com.web.nrs.service.impl;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.PostActivityEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.repository.PostActivityRepository;
import com.web.nrs.service.PostActivityService;
import com.web.nrs.utils.ConstantUtils;
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

    @Override
    public List<Map<String, Object>> getAllPostsWithEmployeeDetails() {
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
}
