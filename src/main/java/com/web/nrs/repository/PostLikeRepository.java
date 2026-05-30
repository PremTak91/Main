package com.web.nrs.repository;

import com.web.nrs.entity.PostActivityEntity;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.entity.PostLikeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLikeEntity, Long> {
    
    long countByPostId(Long postId);
    
    boolean existsByPostIdAndEmployeeId(Long postId, Long employeeId);
    
    Optional<PostLikeEntity> findByPostIdAndEmployeeId(Long postId, Long employeeId);
    
    List<PostLikeEntity> findAllByPostIdOrderByCreatedAtDesc(Long postId);
}
