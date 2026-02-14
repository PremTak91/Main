package com.web.nrs.service;

import com.web.nrs.entity.PostActivityEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface PostActivityService {
    List<Map<String, Object>> getAllPostsWithEmployeeDetails();
    void savePost(Long empId, String postText, MultipartFile postImage) throws Exception;
    void updatePost(Long id, String postText, MultipartFile postImage) throws Exception;
    PostActivityEntity getPostById(Long id);
}
