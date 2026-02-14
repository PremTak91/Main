package com.web.nrs.service.impl;

import com.web.nrs.entity.InquiryEntity;
import com.web.nrs.repository.InquiryRepository;
import com.web.nrs.service.InquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InquiryServiceImpl implements InquiryService {

    private final InquiryRepository inquiryRepository;

    @Override
    public Page<InquiryEntity> getAllInquiries(Pageable pageable) {
        return inquiryRepository.findAll(pageable);
    }

    @Override
    public InquiryEntity getInquiryById(Long id) {
        return inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inquiry not found with id: " + id));
    }

    @Override
    public InquiryEntity saveInquiry(InquiryEntity inquiry) {
        return inquiryRepository.save(inquiry);
    }

    @Override
    public void deleteInquiry(Long id) {
        if (!inquiryRepository.existsById(id)) {
            throw new RuntimeException("Inquiry not found with id: " + id);
        }
        inquiryRepository.deleteById(id);
    }
}
