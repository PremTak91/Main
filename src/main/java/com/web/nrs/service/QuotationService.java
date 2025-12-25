package com.web.nrs.service;

import com.lowagie.text.BadElementException;
import com.web.nrs.model.SolarQuotation;

import java.io.IOException;


public interface QuotationService {
	public byte[] generateQuotationPdf(SolarQuotation quotation) throws BadElementException, IOException;

}
