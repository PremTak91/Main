package com.web.nrs.repository;

import com.web.nrs.entity.PostActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostActivityRepository extends JpaRepository<PostActivityEntity, Long> {
    List<PostActivityEntity> findAllByOrderByAuditTimeStampDesc();
}
