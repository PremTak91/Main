package com.web.nrs.controller;

import com.web.nrs.model.SolarQuotation;
import com.web.nrs.service.QuotationService;
import com.web.nrs.utils.ConstantUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
@RequestMapping("/quts")
public class QuationController {

    @Autowired
    private QuotationService quotationService;

    // ── Short-lived in-memory PDF store ──────────────────────────────────────
    // Maps one-time UUID token → raw PDF bytes.
    // Tokens are removed on first access (single-use) and auto-expire after
    // 10 minutes so memory is never leaked even if the client never fetches.
    private static final Map<String, byte[]> PDF_TOKEN_CACHE = new ConcurrentHashMap<>();
    private static final Timer CLEANUP_TIMER = new Timer("pdf-token-cleanup", true /* daemon */);

    // ── Page ─────────────────────────────────────────────────────────────────

    @GetMapping
    public String viewQuotationPage(Model model) {
        model.addAttribute(ConstantUtils.QUOTATION_SEQUENCE_NUMBER_KEY,
                quotationService.getDocumentSequence());
        return "quotation";
    }

    // ── Desktop path ─────────────────────────────────────────────────────────
    // POST /quts  →  binary PDF blob with Content-Disposition: attachment
    // Used by desktop browsers that can handle blob downloads natively.

    @PostMapping
    public ResponseEntity<byte[]> generateQuotation(@RequestBody SolarQuotation quotation) {
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

    // ── Mobile path – Step 1 ─────────────────────────────────────────────────
    // POST /quts/token  →  {"token":"<uuid>","viewUrl":"/NRS/quts/view/<uuid>"}
    //
    // Android WebView (Replit APK) and mobile browsers call this endpoint.
    // The client then navigates window.location.href → viewUrl.
    // Because it is a simple page-navigation GET request the JWT cookie is sent
    // automatically, no WRITE_EXTERNAL_STORAGE permission is ever needed, and
    // the WebView/browser handles the PDF natively (inline viewer or Intent).

    @PostMapping("/token")
    @ResponseBody
    public ResponseEntity<Map<String, String>> prepareToken(@RequestBody SolarQuotation quotation) {
        try {
            byte[] pdfBytes = quotationService.generateQuotationPdf(quotation);
            String token = UUID.randomUUID().toString();
            PDF_TOKEN_CACHE.put(token, pdfBytes);

            // Auto-expire after 10 minutes (safety net; single-use already removes it)
            CLEANUP_TIMER.schedule(new TimerTask() {
                @Override public void run() { PDF_TOKEN_CACHE.remove(token); }
            }, 10 * 60 * 1000L);

            Map<String, String> body = new HashMap<>();
            body.put("token", token);
            body.put("viewUrl", "/NRS/quts/view/" + token);
            return ResponseEntity.ok(body);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> err = new HashMap<>();
            err.put("error", "PDF generation failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    // ── Mobile path – Step 2 ─────────────────────────────────────────────────
    // GET /quts/view/{token}  →  binary PDF with Content-Disposition: inline
    //
    // The WebView navigates here as a normal page load (JWT cookie is sent
    // automatically).  Responding with "inline" means Android opens the PDF
    // in the system PDF viewer via an Intent — no storage permission required.
    // The token is consumed on first access so it cannot be replayed.

    @GetMapping("/view/{token}")
    public ResponseEntity<byte[]> viewPdf(@PathVariable String token) {
        byte[] pdfBytes = PDF_TOKEN_CACHE.remove(token); // single-use
        if (pdfBytes == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("PDF link has expired or was already used.".getBytes());
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition
                .inline()
                .filename("quotation.pdf")
                .build());
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}


