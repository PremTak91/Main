package com.web.nrs.service;

import com.lowagie.text.BadElementException;
import com.web.nrs.model.SolarQuotation;

import java.io.IOException;


public interface QuotationService {
	public byte[] generateQuotationPdf(SolarQuotation quotation) throws Exception;
	String getDocumentSequence();
	org.springframework.data.domain.Page<com.web.nrs.entity.QuotationLogEntity> getQuotationLogs(
			String customerName, String submittedBy, java.time.LocalDate startDate, java.time.LocalDate endDate, String createdByName, org.springframework.data.domain.Pageable pageable);
	void deleteQuotationLog(Long id);
}
