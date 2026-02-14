package com.web.nrs.repository;

import com.web.nrs.entity.HolidayEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<HolidayEntity, Long> {
    List<HolidayEntity> findByYearOrderByHolidayDateAsc(Integer year);
    List<HolidayEntity> findByYearAndIsOptionalOrderByHolidayDateAsc(Integer year, Boolean isOptional);
}
