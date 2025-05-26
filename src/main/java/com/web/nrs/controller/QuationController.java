package com.web.nrs.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.*;
import com.web.nrs.model.SolarQuotation;
import com.web.nrs.service.QuotationService;

@Controller
public class QuationController {
	
	@Autowired
	private QuotationService quotationService;
	
	@GetMapping("/quts")
	public String loginHome() {
		return "quts";
	}
	
	@PostMapping("/quts")
	public ResponseEntity<byte[]> generateQuation(@RequestBody SolarQuotation quotation) {
		
        try {
            byte[] pdfBytes = quotationService.generateQuotationPdf(quotation);


            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition
                    .attachment()
                    .filename("quotation.pdf")
                    .build());

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
        	e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("PDF Generation Error: " + e.getMessage()).getBytes());
        }
    }
	
	
	

}
