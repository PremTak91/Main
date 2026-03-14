package com.web.nrs.service.impl;

import com.web.nrs.entity.DocumentSequenceEntity;
import com.web.nrs.repository.DocumentSequenceRepository;
import com.web.nrs.service.DocumentSequenceService;
import com.web.nrs.utils.ConstantUtils;
import com.web.nrs.utils.NrsUtils;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class DocumentSequenceServiceImpl  implements DocumentSequenceService {
    private DocumentSequenceRepository documentSequenceRepository;

    @Transactional
    @Override
    public String getSequenceForUpdate(String docType) {
        String financialYear = NrsUtils.getFinancialYear();
        DocumentSequenceEntity sequence = documentSequenceRepository.getSequenceForUpdate(docType, financialYear);
        int nextNumber;

        if (sequence == null) {
            nextNumber = 1;
            sequence = new DocumentSequenceEntity();
            sequence.setDocType(ConstantUtils.DOC_TYPE_QUOTATION);
            sequence.setFinancialYear(financialYear);
            sequence.setLastNumber(nextNumber);
            sequence = documentSequenceRepository.save(sequence);
        } else {
            nextNumber = sequence.getLastNumber() + 1;
        }


        return "NRS/" + financialYear + "/" + String.format("%03d", nextNumber);
    }

    @Override
    public void incrementSequence(String docType, String sequence) {
        String financialYear = NrsUtils.getFinancialYear();
        documentSequenceRepository.incrementSequence(docType, financialYear, sequence);
    }
}
