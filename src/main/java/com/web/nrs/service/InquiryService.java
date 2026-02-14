package com.web.nrs.service;

import com.web.nrs.entity.InquiryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InquiryService {

    Page<InquiryEntity> getAllInquiries(Pageable pageable);

    InquiryEntity getInquiryById(Long id);

    InquiryEntity saveInquiry(InquiryEntity inquiry);

    void deleteInquiry(Long id);
}
