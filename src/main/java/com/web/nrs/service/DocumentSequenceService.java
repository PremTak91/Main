package com.web.nrs.service;

import com.web.nrs.entity.DocumentSequenceEntity;

public interface DocumentSequenceService {
    String getSequenceForUpdate(String docType);
    void incrementSequence(String docType, String sequence);
}
