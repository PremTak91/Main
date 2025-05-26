package com.web.nrs.service;

import java.io.IOException;


import com.lowagie.text.BadElementException;
import com.web.nrs.model.SolarQuotation;


public interface QuotationService {
	public byte[] generateQuotationPdf(SolarQuotation quotation) throws BadElementException, IOException;

}
