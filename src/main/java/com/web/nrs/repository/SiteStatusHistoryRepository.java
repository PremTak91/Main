package com.web.nrs.repository;

import com.web.nrs.entity.SiteStatusHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SiteStatusHistoryRepository extends JpaRepository<SiteStatusHistoryEntity, Long> {
    List<SiteStatusHistoryEntity> findBySiteIdOrderByUpdatedAtDesc(Long siteId);
}
