package com.web.nrs.controller;

import com.web.nrs.model.SolarQuotation;
import com.web.nrs.service.QuotationService;
import com.web.nrs.utils.ConstantUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/quts")
public class QuationController {
	
	@Autowired
	private QuotationService quotationService;
	
	@GetMapping
	public String viewQuotationPage(Model model)
    {
        model.addAttribute(ConstantUtils.QUOTATION_SEQUENCE_NUMBER_KEY, quotationService.getDocumentSequence());
		return "quotation";
	}
	
	/**
	 * Generates the solar quotation PDF.
	 *
	 * On Android WebView (Replit APK), Content-Disposition: attachment triggers the
	 * system download manager which is not configured inside a WebView sandbox, causing
	 * "Save file failed" and app crashes.  We detect the WebView User-Agent and switch
	 * to Content-Disposition: inline so the WebView/system PDF viewer opens the file
	 * directly.  Desktop browsers continue to receive attachment disposition.
	 */
	@PostMapping
	public ResponseEntity<byte[]> generateQuotation(
			@RequestBody SolarQuotation quotation,
			@RequestHeader(value = "User-Agent", defaultValue = "") String userAgent) {
		
        try {
            byte[] pdfBytes = quotationService.generateQuotationPdf(quotation);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);

            // Android WebView user-agents contain "wv" or carry "Version/x.x" without
            // being a standalone browser.  For those clients use inline so the OS PDF
            // viewer Intent is triggered instead of the download manager.
            boolean isAndroidWebView = userAgent.contains("Android")
                    && (userAgent.contains("wv") || userAgent.contains("Version/"));

            if (isAndroidWebView) {
                headers.setContentDisposition(ContentDisposition
                        .inline()
                        .filename("quotation.pdf")
                        .build());
            } else {
                headers.setContentDisposition(ContentDisposition
                        .attachment()
                        .filename("quotation.pdf")
                        .build());
            }

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
        	e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("PDF Generation Error: " + e.getMessage()).getBytes());
        }
    }


}

