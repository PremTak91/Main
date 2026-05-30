package com.web.nrs.repository;

import com.web.nrs.entity.PostCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCommentRepository extends JpaRepository<PostCommentEntity, Long> {
    
    long countByPostId(Long postId);
    
    List<PostCommentEntity> findAllByPostIdOrderByCreatedAtAsc(Long postId);
}
