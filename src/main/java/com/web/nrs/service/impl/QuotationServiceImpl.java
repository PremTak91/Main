package com.web.nrs.service.impl;

import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.web.nrs.model.SolarQuotation;
import com.web.nrs.service.DocumentSequenceService;
import com.web.nrs.service.QuotationService;
import com.web.nrs.utils.ConstantUtils;
import lombok.AllArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@AllArgsConstructor
public class QuotationServiceImpl implements QuotationService {

    private final DocumentSequenceService documentSequenceService;

    // ===== BRAND COLORS =====
    private static final Color PRIMARY   = new Color(0x0B, 0x2C, 0x5F);
    private static final Color ORANGE    = new Color(0xFF, 0x7A, 0x00);
    private static final Color GREEN     = new Color(0x2E, 0x7D, 0x32);
    private static final Color LIGHT_BG  = new Color(0xF4, 0xF6, 0xFA);
    private static final Color DARK      = new Color(0x22, 0x22, 0x22);
    private static final Color NAVY2     = new Color(0x0D, 0x3A, 0x7A);

    // A4 page dimensions (portrait)
    private static final float PW = PageSize.A4.getWidth();   // ~595
    private static final float PH = PageSize.A4.getHeight();  // ~842

    private static final float HALF_LINE_LEADING = 4f;

    private static Paragraph createHalfLineSpace() {
        Paragraph p = new Paragraph(" ", new Font(Font.NORMAL, 1));
        p.setLeading(HALF_LINE_LEADING);
        return p;
    }

    // ===== FONTS =====
    private static Font fWhiteBold(float size) { return new Font(Font.HELVETICA, size, Font.BOLD, Color.WHITE); }
    private static Font fOrange(float size)     { return new Font(Font.HELVETICA, size, Font.BOLD, ORANGE); }
    private static Font fPrimary(float size)    { return new Font(Font.HELVETICA, size, Font.BOLD, PRIMARY); }
    private static Font fDark(float size)       { return new Font(Font.HELVETICA, size, Font.NORMAL, DARK); }
    private static Font fLight(float size)      { return new Font(Font.HELVETICA, size, Font.NORMAL, new Color(200, 220, 255)); }

    @Override
    public String getDocumentSequence() {
        return documentSequenceService.getSequenceForUpdate(ConstantUtils.DOC_TYPE_QUOTATION);
    }

    private void updateDocumentSequence(String seq) {
        documentSequenceService.incrementSequence(ConstantUtils.DOC_TYPE_QUOTATION, seq);
    }

    @Override
    public byte[] generateQuotationPdf(SolarQuotation q) throws Exception {
        if (q.getQuotationDate() == null)
            q.setQuotationDate(LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")));
        if (q.getPaybackPeriod() == null) q.setPaybackPeriod("4-5 Years");
        if (q.getAnnualSaving()  == null) q.setAnnualSaving("Rs.18,000 / year");
        if (q.getEmiOption()     == null) q.setEmiOption("From Rs.3,500 / month");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 0, 0, 0, 0);
        
        // Critical Fix: Margins MUST be injected BEFORE doc.open() to take effect on the first page!
        if ("Single Page".equalsIgnoreCase(q.getPdfType())) {
            doc.setMargins(40, 40, 50, 30);
        }
        
        PdfWriter writer = PdfWriter.getInstance(doc, out);
        doc.open();

        if ("Single Page".equalsIgnoreCase(q.getPdfType())) {
            addQuotationPage(doc, q);
        } else {
            page1(doc, writer, q);
            doc.newPage();
            page2(doc, writer, q.getSubmittedNumber());
            doc.newPage();
            page3(doc, writer, q);
            doc.newPage();
            page4(doc, writer);
            doc.newPage();
            page5(doc, writer, q);
            doc.setMargins(40, 40, 50, 30);
            doc.newPage();
        }

        doc.close();
        updateDocumentSequence(q.getQuationNumber() != null ? q.getQuationNumber().split("/")[2] : "01");
        return out.toByteArray();
    }

    // ── helper: load Image from classpath ─────────────────────────────────────
    private static Image loadImg(String path) throws Exception {
        ClassPathResource r = new ClassPathResource(path);
        return Image.getInstance(r.getInputStream().readAllBytes());
    }

    // ── helper: draw filled rect ───────────────────────────────────────────────
    private static void fillRect(PdfContentByte cb, Color c, float x, float y, float w, float h) {
        cb.setColorFill(c); cb.rectangle(x, y, w, h); cb.fill();
    }

    // ── helper: draw rounded rect filled ─────────────────────────────────────
    private static void fillRound(PdfContentByte cb, Color c, float x, float y, float w, float h, float r) {
        cb.setColorFill(c); cb.roundRectangle(x, y, w, h, r); cb.fill();
    }

    // ── helper: stroke rounded rect ─────────────────────────────────────────
    private static void strokeRound(PdfContentByte cb, Color c, float lw, float x, float y, float w, float h, float r) {
        cb.setColorStroke(c); cb.setLineWidth(lw); cb.roundRectangle(x, y, w, h, r); cb.stroke();
    }

    // ── helper: show text at position ────────────────────────────────────
    private static void txt(PdfContentByte cb, int align, Phrase ph, float x, float y) {
        ColumnText.showTextAligned(cb, align, ph, x, y, 0);
    }



    // ── helper: page header bar ───────────────────────────────────────────────
    private static void pageHeader(PdfContentByte cb, String title, String subtitle, int pageNum) {
        // Change header background to soft light gray so the PNG logo blends seamlessly
        fillRect(cb, LIGHT_BG, 0, PH - 90, PW, 90);
        fillRect(cb, ORANGE,  0, PH - 93, PW, 3);
        
        try {
            Image logo = loadImg("static/images/nrslogo.png");
            logo.scaleToFit(140, 62);
            logo.setAbsolutePosition(20, PH - 76);
            cb.addImage(logo);
        } catch (Exception ignored) {}
        
        // Use primary color for text since background is now white
        txt(cb, Element.ALIGN_LEFT,  new Phrase(title,    fPrimary(16)), 170, PH - 46);
        txt(cb, Element.ALIGN_LEFT,  new Phrase(subtitle, fDark(10)),   170, PH - 65);
        // Page number — orange circle badge
        float bnX = PW - 58, bnY = PH - 76, bnW = 42, bnH = 42;
        fillRound(cb, ORANGE, bnX, bnY, bnW, bnH, 21);
        txt(cb, Element.ALIGN_CENTER,
                new Phrase(String.format("%02d", pageNum), fWhiteBold(13)),
                bnX + bnW / 2, bnY + bnH / 2 - 5);
    }


    // ── helper: bottom strip ─────────────────────────────────────────────────
    private static void bottomStrip(PdfContentByte cb, String line1, String line2) {
        fillRect(cb, PRIMARY, 0, 0, PW, 55);
        fillRect(cb, ORANGE,  0, 52, PW, 3);
        txt(cb, Element.ALIGN_CENTER, new Phrase(line1, fWhiteBold(9)),  PW / 2, 30);
        txt(cb, Element.ALIGN_CENTER, new Phrase(line2, fLight(8)),      PW / 2, 14);
    }

    // ======================================================
    // PAGE 1 – PREMIUM COVER
    // ======================================================
    private void page1(Document doc, PdfWriter writer, SolarQuotation q) throws Exception {
        PdfContentByte cb = writer.getDirectContent();

        // Full-page deep blue background
        fillRect(cb, PRIMARY, 0, 0, PW, PH);

        // Top band - Soft Light Gray so PNG logo background blends nicely
        fillRect(cb, LIGHT_BG, 0, PH - 85, PW, 85);
        fillRect(cb, ORANGE, 0, PH - 88, PW, 3);

        // Orange diagonal accent (top-right triangle)
        cb.setColorFill(ORANGE);
        cb.moveTo(PW - 140, PH); cb.lineTo(PW, PH); cb.lineTo(PW, PH - 140);
        cb.closePath(); cb.fill();

        // NRS logo (PNG)
        try {
            Image logo = loadImg("static/images/nrslogo.png");
            logo.scaleToFit(160, 75); logo.setAbsolutePosition(20, PH - 80); cb.addImage(logo);
        } catch (Exception ignored) {}


        // PM Surya Ghar badge
        fillRound(cb, ORANGE, PW - 195, PH - 62, 165, 30, 15);
        txt(cb, Element.ALIGN_CENTER, new Phrase("PM Surya Ghar Yojana  ✓", fWhiteBold(9)), PW - 113, PH - 44);

        // Hero image (right side)
        try {
            Image hero = loadImg("static/images/solar_cover_hero.png");
            hero.scaleAbsolute(310, 400);
            hero.setAbsolutePosition(PW - 320, PH - 510);
            cb.addImage(hero);
            // Dark overlay bottom of hero
            fillRect(cb, new Color(11, 44, 95, 190), PW - 320, PH - 510, 310, 55);
        } catch (Exception e) {
            fillRect(cb, NAVY2, PW - 320, PH - 510, 310, 400);
        }

        // Headline block (left)
        float hx = 30, hy = PH - 148;
        txt(cb, Element.ALIGN_LEFT, new Phrase("POWER YOUR HOME", fWhiteBold(26)), hx, hy);
        txt(cb, Element.ALIGN_LEFT, new Phrase("WITH SMART SOLAR",  fWhiteBold(26)), hx, hy - 34);
        fillRect(cb, ORANGE, hx, hy - 47, 210, 4);
        txt(cb, Element.ALIGN_LEFT, new Phrase("SOLUTIONS", fOrange(26)),            hx, hy - 66);
        // Subtitle — solid dark backing (alpha is NOT supported without PdfGState)
        fillRect(cb, new Color(8, 30, 70), hx - 6, hy - 108, 270, 26);
        txt(cb, Element.ALIGN_LEFT,
            new Phrase("Clean Energy for a Sustainable Future",
                new Font(Font.HELVETICA, 12, Font.BOLD, new Color(255, 215, 100))), hx, hy - 94);

        // Stat badges
        float sy = hy - 140;
        drawStatBadge(cb, hx,        sy, "25+",  "Years Warranty");
        drawStatBadge(cb, hx + 90,   sy, "500+", "Installations");
        drawStatBadge(cb, hx + 180,  sy, "100%", "Green Energy");

        // PM Surya Ghar NATIVE Graphic (Vectorized text system replacing mismatched image)
        float pmX = 30;
        float pmTop = 490; // Placed perfectly below the statistics badges
        
        // Title Block
        txt(cb, Element.ALIGN_LEFT, new Phrase("PM Surya Ghar:", fWhiteBold(22)), pmX, pmTop);
        txt(cb, Element.ALIGN_LEFT, new Phrase("Muft Bijli Yojana", new Font(Font.HELVETICA, 22, Font.BOLD, new Color(50, 190, 220))), pmX, pmTop - 26);
        
        // Quote Container (Solid classy cyan/teal backing)
        float qW = 245;
        float qH = 145;
        float qY = pmTop - 35 - qH;
        
        fillRound(cb, new Color(20, 100, 125), pmX, qY, qW, qH, 10);
        strokeRound(cb, new Color(40, 140, 170), 1.0f, pmX, qY, qW, qH, 10);
        
        // Quote Stylized Mark ('“')
        txt(cb, Element.ALIGN_LEFT, new Phrase("“", new Font(Font.HELVETICA, 45, Font.BOLD, new Color(130, 200, 220))), pmX + 15, qY + qH - 35);
        
        // Quote Text Flowing block
        ColumnText ct = new ColumnText(cb);
        ct.setSimpleColumn(pmX + 22, qY + 15, pmX + qW - 22, qY + qH - 20);
        String quoteTxt = "\"In order to further sustainable development and people's well-being, we are launching the PM Surya Ghar: Muft Bijli Yojana. This project, with an investment of over Rs. 75,000 crores, aims to light up 1 crore households by providing up to 300 units of free electricity every month.\"";
        Paragraph pQuote = new Paragraph(quoteTxt, new Font(Font.HELVETICA, 9.5f, Font.ITALIC, Color.WHITE));
        pQuote.setAlignment(Element.ALIGN_CENTER);
        ct.addElement(pQuote);
        ct.go();
        
        // Signature Block
        float sigY = qY - 24;
        txt(cb, Element.ALIGN_RIGHT, new Phrase("Shri Narendra Modi", fWhiteBold(11)), pmX + qW - 10, sigY);
        txt(cb, Element.ALIGN_RIGHT, new Phrase("Hon'ble Prime Minister of India", new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(180, 220, 255))), pmX + qW - 10, sigY - 14);

        // Client info card (bottom-left) — solid slightly-lighter navy, expanded height & padding
        float cx = 25, cy = 90, cw = 275, ch = 135; // Increased height for wrapping
        cb.setColorFill(new Color(16, 52, 110));
        cb.roundRectangle(cx, cy, cw, ch, 10); cb.fill();
        cb.setColorStroke(ORANGE); cb.setLineWidth(1.5f); cb.roundRectangle(cx, cy, cw, ch, 10); cb.stroke();

        float topY = cy + ch;
        txt(cb, Element.ALIGN_LEFT, new Phrase("PREPARED FOR", fLight(8.5f)), cx + 18, topY - 20);
        String client = q.getCustomerName() != null ? q.getCustomerName() : "Valued Customer";
        String mobile = q.getCustomerMobileNumber() != null ? q.getCustomerMobileNumber().trim() : "";

        ColumnText ctClient = new ColumnText(cb);
        ctClient.setSimpleColumn(cx + 18, topY - 70, cx + cw - 15, topY - 22);
        
        Font nameFont = client.length() > 22 ? fWhiteBold(13) : fWhiteBold(16);
        Paragraph pClient = new Paragraph(client, nameFont);
        pClient.setLeading(client.length() > 22 ? 15f : 18f);
        ctClient.addElement(pClient);
        
        if (!mobile.isEmpty()) {
            Paragraph pMobile = new Paragraph("+91 " + mobile, fLight(11f));
            if (!mobile.startsWith("+")) {
                pMobile = new Paragraph(mobile.length() == 10 ? "+91 " + mobile : mobile, fLight(11f));
            } else {
                pMobile = new Paragraph(mobile, fLight(11f));
            }
            pMobile.setSpacingBefore(4f);
            pMobile.setLeading(14f);
            ctClient.addElement(pMobile);
        }
        
        try { ctClient.go(); } catch (Exception e) {}
        
        // Separator line with proper horizontal padding
        fillRect(cb, new Color(80, 120, 180), cx + 15, topY - 72, cw - 30, 1);
        
        txt(cb, Element.ALIGN_LEFT, new Phrase("System: " + q.getKw() + " kW", fOrange(11)), cx + 18, topY - 88);
        txt(cb, Element.ALIGN_LEFT, new Phrase("Date: " + q.getQuotationDate(), fLight(9.5f)), cx + 18, topY - 106);
        String prop = q.getQuationNumber() != null ? q.getQuationNumber() : "NRS/2026/001";
        txt(cb, Element.ALIGN_LEFT, new Phrase("Proposal: " + prop, fLight(9.5f)), cx + 18, topY - 124);

        // Bottom orange footer
        fillRect(cb, ORANGE, 0, 0, PW, 60);
        fillRect(cb, new Color(220, 60, 0), 0, 57, PW, 3);
        txt(cb, Element.ALIGN_CENTER,
            new Phrase("NRS Solar Solution  |  www.nrssolarsolution.com  |  Gujarat – MNRE Registered", fWhiteBold(9)),
            PW / 2, 32);
        txt(cb, Element.ALIGN_CENTER,
            new Phrase("HP petrol pump, Shyam business park, 12, Aslali, Ahmedabad, Gujarat 382427  |  info@nrssolarsolution@gmail.com  | "+q.getSubmittedNumber(),
                new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(255, 235, 200))), PW / 2, 14);
    }

    private static void drawStatBadge(PdfContentByte cb, float x, float y, String v, String label) {
        // Solid navy background (alpha transparency is NOT supported without PdfGState in OpenPDF)
        fillRound(cb, new Color(13, 50, 110), x, y - 26, 83, 50, 8);
        // Solid orange border
        cb.setColorStroke(ORANGE);
        cb.setLineWidth(1.5f);
        cb.roundRectangle(x, y - 26, 83, 50, 8);
        cb.stroke();
        
        // Shifted the number baseline down dynamically to prevent upper-bound collision
        txt(cb, Element.ALIGN_CENTER, new Phrase(v, fOrange(16)), x + 41, y + 3);
        txt(cb, Element.ALIGN_CENTER,
            new Phrase(label, new Font(Font.HELVETICA, 7, Font.BOLD, new Color(255, 215, 100))),
            x + 41, y - 13);
    }

    // ======================================================
    // PAGE 2 – WHY SOLAR + COMPANY TRUST
    // ======================================================
    private void page2(Document doc, PdfWriter writer, String contactPersonNumber) throws Exception {
        PdfContentByte cb = writer.getDirectContent();
        fillRect(cb, LIGHT_BG, 0, 0, PW, PH);
        pageHeader(cb, "Why Solar?  Why NRS?",
            "Smart decisions backed by clean energy and trusted service", 2);

        float colW = PW / 2 - 40;
        float lx   = 30, rx = PW / 2 + 10, topY = PH - 120;

        // LEFT header
        fillRound(cb, ORANGE, lx, topY - 24, colW, 28, 6);
        txt(cb, Element.ALIGN_LEFT, new Phrase("  SOLAR BENEFITS", fWhiteBold(10)), lx + 8, topY - 10);

        String[][] bens = {
            {"*", "Up to 90% Savings on Bills",       "Drastically cut your monthly electricity cost"},
            {"G", "Subsidy up to Rs.78,000",           "Under PM Surya Ghar Muft Bijli Yojana"},
            {"E", "Net Metering – Earn from Grid",    "Sell excess power & earn monthly credits"},
            {"L", "Zero Carbon Footprint",             "100% clean, renewable solar energy"},
            {"S", "Energy Independence",               "Freedom from power outages & rising tariffs"},
        };
        float cardY = topY - 40;
        for (String[] b : bens) { drawBenefitCard(cb, lx, cardY, colW, b[1], b[2]); cardY -= 78; }

        // RIGHT header
        fillRound(cb, PRIMARY, rx, topY - 24, colW, 28, 6);
        txt(cb, Element.ALIGN_LEFT, new Phrase("  WHY CHOOSE NRS SOLAR", fWhiteBold(10)), rx + 8, topY - 10);

        // Company card — height increased to 160 to prevent overlap with stats
        float compCardH = 160;
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(220, 228, 240));
        cb.setLineWidth(1f); cb.roundRectangle(rx, topY - 30 - compCardH, colW, compCardH, 8); cb.fillStroke();
        txt(cb, Element.ALIGN_LEFT, new Phrase("NRS Solar Solution",       fPrimary(13)), rx + 12, topY - 50);
        txt(cb, Element.ALIGN_LEFT,
            new Phrase("Your Trusted Solar Partner in Gujarat",
                new Font(Font.HELVETICA, 9, Font.ITALIC, DARK)), rx + 12, topY - 66);
        fillRect(cb, new Color(220, 228, 240), rx + 12, topY - 77, colW - 24, 1);

        String[] feats = {
            "  Authorized MNRE Registered Installer",
            "  Gujarat GEDA Empanelled",
            "  End-to-End: Design to Commissioning",
            "  10-Year Inverter Warranty",
            "  Full Subsidy & Net Metering Support",
        };
        float fy = topY - 94;
        for (String f : feats) {
            txt(cb, Element.ALIGN_LEFT,
                new Phrase(f, new Font(Font.HELVETICA, 9, Font.NORMAL, DARK)), rx + 12, fy);
            fy -= 14;
        }

        // Trust stats — placed below company card with proper gap
        float sty = topY - 30 - compCardH - 55;
        drawTrustStat(cb, rx,             sty, "500+", "Projects");
        drawTrustStat(cb, rx + colW / 3,  sty, "8+",   "Years");
        drawTrustStat(cb, rx + 2*colW/3,  sty, "99%",  "Satisfaction");

        // Cert cards
        String[][] certs = {
            {"MNRE Registered",    "Ministry of New & Renewable Energy authorized."},
            {"GEDA Empanelled",    "Gujarat Energy Development Agency approved."},
            {"Top-Brand Panels",   "WAAREE, Adani, Vikram Solar & more."},
            {"After-Sales Support","Dedicated AMC & maintenance for 25+ years."},
        };
        float cy2 = sty - 55;
        for (String[] c : certs) { drawCertCard(cb, rx, cy2, colW, c[0], c[1]); cy2 -= 46; }

        bottomStrip(cb,
            "Authorized Dealer  |  GEDA Empanelled  |  Trusted by 500+ Families",
            "www.nrssolarsolution.com  |  "+contactPersonNumber);
    }

    private static void drawBenefitCard(PdfContentByte cb, float x, float y, float w, String title, String desc) {
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(220, 230, 245));
        cb.setLineWidth(1f); cb.roundRectangle(x, y - 63, w, 70, 8); cb.fillStroke();
        fillRect(cb, ORANGE, x, y - 63, 4, 70);
        txt(cb, Element.ALIGN_LEFT, new Phrase(title, fPrimary(10)),              x + 14, y - 18);
        txt(cb, Element.ALIGN_LEFT,
            new Phrase(desc, new Font(Font.HELVETICA, 8, Font.NORMAL, new Color(100, 110, 140))),
            x + 14, y - 33);
    }

    private static void drawTrustStat(PdfContentByte cb, float x, float y, String v, String label) {
        fillRound(cb, LIGHT_BG, x + 5, y - 10, 78, 48, 6);
        txt(cb, Element.ALIGN_CENTER, new Phrase(v, fPrimary(17)), x + 44, y + 22);
        txt(cb, Element.ALIGN_CENTER,
            new Phrase(label, new Font(Font.HELVETICA, 7, Font.NORMAL, DARK)), x + 44, y + 4);
    }

    private static void drawCertCard(PdfContentByte cb, float x, float y, float w, String title, String desc) {
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(220, 228, 240));
        cb.setLineWidth(0.8f); cb.roundRectangle(x, y - 30, w, 38, 6); cb.fillStroke();
        fillRound(cb, GREEN, x, y - 30, 5, 38, 3);
        txt(cb, Element.ALIGN_LEFT, new Phrase(title, fPrimary(9)), x + 12, y - 8);
        txt(cb, Element.ALIGN_LEFT,
            new Phrase(desc, new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(100, 110, 130))),
            x + 12, y - 22);
    }

    // ======================================================
    // PAGE 3 – SOLAR PANEL FULL VISUAL & SPECS
    // ======================================================
    private void page3(Document doc, PdfWriter writer, SolarQuotation q) throws Exception {
        PdfContentByte cb = writer.getDirectContent();
        fillRect(cb, Color.WHITE, 0, 0, PW, PH);

        // 1. Standard Page Header
        pageHeader(cb, "Solar Panel Specifications", "High Output - High Durability, Zero Compromise", 3);

        // 2. Cyan / Teal Banner Background
        float bTop = PH - 90;
        float bH = 265;
        float bBot = bTop - bH;
        fillRect(cb, new Color(35, 165, 195), 0, bBot, PW, bH);

        // 3. Banner Title Text
        txt(cb, Element.ALIGN_CENTER, new Phrase("SOLAR PANEL SPECIFICATIONS", fWhiteBold(22)), PW / 2, bTop - 40);
        txt(cb, Element.ALIGN_CENTER, new Phrase("High Output • High Durability • Zero Compromise", fWhiteBold(11)), PW / 2, bTop - 60);

        // 4. Panel Image (Shrunk to provide more vertical space below)
        float imgH = 340, imgW = 170, imgX = 35; 
        float imgY = 680 - imgH; // Top is 680, bottom is 340
        
        try {
            Image panel = loadImg("static/images/solar_panel.png");
            panel.scaleAbsolute(imgW, imgH);
            panel.setAbsolutePosition(imgX, imgY);
            cb.setColorStroke(new Color(220, 225, 235)); cb.setLineWidth(1.5f);
            cb.rectangle(imgX-1, imgY-1, imgW+2, imgH+2); cb.stroke();
            cb.addImage(panel);
        } catch (Exception e) {
            fillRect(cb, new Color(15, 30, 60), imgX, imgY, imgW, imgH);
        }

        // 5. Right Side of Banner (Beside panel)
        float rx = imgX + imgW + 30; // 235
        float rCenter = rx + (PW - 35 - rx) / 2f; 
        
        // Yellow Label
        fillRound(cb, new Color(255, 215, 0), rx, bTop - 110, 195, 36, 6);
        txt(cb, Element.ALIGN_LEFT, new Phrase("#1 Solar Panel!", new Font(Font.HELVETICA, 18, Font.BOLD, DARK)), rx + 15, bTop - 100);

        // Bullets
        float by = bTop - 138;
        String[] bullets = {"▶ High Output.", "▶ High Durability,", "▶ Zero Compromise."};
        for(String b : bullets) {
            txt(cb, Element.ALIGN_LEFT, new Phrase(b, fWhiteBold(10)), rx + 5, by);
            by -= 20;
        }

        // White Vector Shield Graphic (Instead of basic circle)
        float scx = rx + 185;
        float scy = bTop - 155;
        
        // Draw Shield Base
        cb.setColorFill(Color.WHITE);
        cb.moveTo(scx, scy + 28);
        cb.lineTo(scx + 24, scy + 16);
        cb.lineTo(scx + 24, scy - 8);
        cb.curveTo(scx + 24, scy - 20, scx + 10, scy - 26, scx, scy - 32);
        cb.curveTo(scx - 10, scy - 26, scx - 24, scy - 20, scx - 24, scy - 8);
        cb.lineTo(scx - 24, scy + 16);
        cb.closePath();
        cb.fill();

        // Thick Cyan Checkmark fully rendered via vector lines
        cb.setColorStroke(new Color(35, 165, 195));
        cb.setLineWidth(4.5f);
        cb.setLineCap(PdfContentByte.LINE_CAP_ROUND);
        cb.setLineJoin(PdfContentByte.LINE_JOIN_ROUND);
        cb.moveTo(scx - 10, scy - 2);
        cb.lineTo(scx - 2, scy - 10);
        cb.lineTo(scx + 12, scy + 8);
        cb.stroke();

        // Dashed horizontal line in banner
        cb.setLineDash(4, 4); cb.setColorStroke(new Color(150, 220, 240));
        cb.moveTo(rx, bBot + 55); cb.lineTo(PW - 35, bBot + 55); cb.stroke();
        cb.setLineDash(0);

        // Banner Bottom Text
        txt(cb, Element.ALIGN_LEFT, new Phrase( q.getPanelWatt() + " + Wp | BIFACIAL", fWhiteBold(12)), rx, bBot + 30);
        txt(cb, Element.ALIGN_LEFT, new Phrase("Topcon X " + q.getNoOfPanels() + " PANEL | Module", fLight(11)), rx, bBot + 12);

        // 6. Right Side White Space (Dynamic Luxury Panel Chips)
        float wy = 430; // Base Y shifted upwards into the rich clear space below banner
        
        String panelsStr = q.getPanelsName();
        if (panelsStr == null || panelsStr.trim().isEmpty()) {
            panelsStr = "WAAREE"; 
        }
        
        String[] brands = panelsStr.split(",");
        Color[] brandColors = {
            new Color(0x2E, 0x7D, 0x32), // Green
            new Color(0x19, 0x76, 0xD2), // Blue
            new Color(0xD8, 0x43, 0x15), // Deep Orange/Red
            new Color(0x6A, 0x1B, 0x9A), // Purple
            new Color(0x00, 0x83, 0x8F)  // Cyan Dark
        };
        
        float chipH = 26;
        // If multiple brands, begin rendering higher to keep beautifully centered
        float currentY = wy + ((brands.length - 1) * (chipH + 8)) / 2f;
        float chipW = 200;
        float chipX = rCenter - chipW / 2;
        
        for (int i = 0; i < brands.length; i++) {
            String bName = brands[i].trim().toUpperCase();
            Color bColor = brandColors[i % brandColors.length];
            
            if (bName.contains("WAAR") || bName.contains("WAR")) bColor = brandColors[0];
            else if (bName.contains("TOP") || bName.contains("TAP") || bName.contains("RAYZON")) bColor = brandColors[1];
            
            // Draw premium pristine white capsule background
            fillRound(cb, Color.WHITE, chipX, currentY - chipH/2, chipW, chipH, chipH/2);
            // Draw crisp subtle colored border
            cb.setColorStroke(bColor);
            cb.setLineWidth(1.0f);
            cb.roundRectangle(chipX, currentY - chipH/2, chipW, chipH, chipH/2);
            cb.stroke();
            
            // Draw tiny tech dot inside chip
            cb.setColorFill(bColor);
            cb.circle(chipX + 16, currentY, 3.5f);
            cb.fill();
            
            // Draw brand text cleanly inside capsule
            txt(cb, Element.ALIGN_LEFT, new Phrase(bName, new Font(Font.HELVETICA, 10, Font.BOLD, DARK)), chipX + 28, currentY - 3);
            txt(cb, Element.ALIGN_RIGHT, new Phrase("Partner", new Font(Font.HELVETICA, 7, Font.ITALIC, new Color(150, 160, 170))), chipX + chipW - 14, currentY - 2.5f);
            
            currentY -= (chipH + 8);
        }
        
        txt(cb, Element.ALIGN_CENTER, new Phrase("Premium Solar Partners", new Font(Font.HELVETICA, 8, Font.ITALIC, ORANGE)), rCenter, currentY + 4);
        
        float dashY = currentY - 12;
        cb.setLineDash(3, 4); cb.setColorStroke(new Color(200, 200, 200));
        cb.moveTo(rx + 20, dashY); cb.lineTo(PW - 45, dashY); cb.stroke();
        cb.setLineDash(0);

        // 7. Approvals Image Grid (Using scaleToFit for perfect aspect ratio)
        float appTop = dashY - 12; // Dynamically guarantees it never overlaps the dynamic stack above
        float appBot = 160; // Top of the warranty circles
        float appMaxH = Math.max(50f, appTop - appBot); // Guaranteed safe area
        
        try {
            // Load as BufferedImage to dynamically erase the ugly baked-in gray gradient!
            java.awt.image.BufferedImage bImg = javax.imageio.ImageIO.read(new org.springframework.core.io.ClassPathResource("static/images/approvals.png").getInputStream());
            
            // Loop through every pixel to detect and wipe out the light-gray shadow artifact
            for (int y = 0; y < bImg.getHeight(); y++) {
                for (int x = 0; x < bImg.getWidth(); x++) {
                    int rgb = bImg.getRGB(x, y);
                    Color c = new Color(rgb, true);
                    int r = c.getRed(), g = c.getGreen(), b = c.getBlue();
                    
                    // The artifact has darker gray patches originally thought.
                    // Lowered tracking threshold to 150 but added a pure gray/shadow check 
                    // (prevents deleting the colorful red MNRE stamp)
                    if (r > 150 && g > 150 && b > 150 && Math.abs(r-g) < 25 && Math.abs(g-b) < 25 && Math.abs(r-b) < 25) {
                        bImg.setRGB(x, y, Color.WHITE.getRGB());
                    }
                }
            }
            
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(bImg, "png", baos);
            Image approvalsImg = Image.getInstance(baos.toByteArray());
            
            // scaleToFit strictly preserves aspect ratio, preventing any squashing/stretching
            approvalsImg.scaleToFit(PW - 50, appMaxH); 
            
            // Mathematically center it in the available block vertically
            float finalH = approvalsImg.getScaledHeight();
            float finalY = appBot + (appMaxH - finalH) / 2f;
            
            // Align strictly to the left edge (X = 35) to match the solar panel layout perfectly
            approvalsImg.setAbsolutePosition(35, finalY);
            cb.addImage(approvalsImg);
        } catch (Exception e) {
            String[][] badges = {{"ALMM Approved"}, {"MNRE Approved"}, {"High Efficient"}, {"DCR Approved"}, {"Top Tier"}, {"Made in India"}};
            float bw = PW / 3f;
            for (int i = 0; i < 6; i++) {
                float bx = (i % 3) * bw + bw / 2f;
                float bbY = appBot + 70 - (i / 3) * 45;
                cb.setColorFill(LIGHT_BG); cb.circle(bx, bbY + 12, 14); cb.fill();
                txt(cb, Element.ALIGN_CENTER, new Phrase("✓", fPrimary(12)), bx, bbY + 7);
                txt(cb, Element.ALIGN_CENTER, new Phrase(badges[i][0], fDark(7)), bx, bbY - 10);
            }
        }

        // 8. 3 Teal Warranty Circles
        String[][] circs = { {"Premium\nSolar\nModules"}, {"BIS &\nMNRE\nCertified"}, {"Safe &\nReliable"} };
        float cw = PW / 3f;
        float cYCenter = 120; // Lowered from 135 to make room for larger approvals
        for (int i = 0; i < 3; i++) {
            float ccx = (i % 3) * cw + cw / 2f;
            Color teal = new Color(30, 160, 150);
            cb.setColorStroke(teal); cb.setLineWidth(1.5f); cb.circle(ccx, cYCenter, 30); cb.stroke();
            cb.setColorFill(teal); cb.circle(ccx, cYCenter, 26); cb.fill();
            String[] lines = circs[i][0].split("\n");
            float tty = cYCenter + (lines.length * 4) - 5;
            for(String line : lines) {
                txt(cb, Element.ALIGN_CENTER, new Phrase(line, fWhiteBold(7)), ccx, tty); tty -= 9;
            }
        }

        // 9. Texts & lines below circles
        cb.setColorStroke(PRIMARY); cb.setLineWidth(1f);
        cb.moveTo(40, 75); cb.lineTo(PW/2 - 110, 75); cb.stroke();
        txt(cb, Element.ALIGN_CENTER, new Phrase("IC JEC & NABL Certified  |  India Climate Tested", new Font(Font.HELVETICA, 8, Font.BOLD, DARK)), PW/2, 72);
        cb.moveTo(PW/2 + 110, 75); cb.lineTo(PW - 40, 75); cb.stroke();
        
        txt(cb, Element.ALIGN_CENTER, new Phrase("Robust 25 Year Performance Guarantee for Maximum Output", new Font(Font.HELVETICA, 8, Font.NORMAL, DARK)), PW/2, 60);

        // 10. Standard Base Footer
        bottomStrip(cb, "WAAREE Premium Panels  |  Official Partner  |  Top Tier Equipment", "Backed by 30-Year Performance Guarantee from Manufacturer");
    }

    // ======================================================
    // PAGE 4 – NET METERING INFOGRAPHIC + DOCUMENTS
    // ======================================================
    private void page4(Document doc, PdfWriter writer) throws Exception {
        PdfContentByte cb = writer.getDirectContent();
        fillRect(cb, LIGHT_BG, 0, 0, PW, PH);
        pageHeader(cb, "Net Metering Process",
                "How your solar system connects with the power grid", 4);

        // Step flow
        float stepW = (PW - 60) / 4f, stepH = 130, stepTopY = PH - 125;
        String[][] steps = {
            {"SUN",  "1. Solar\nGeneration",   "Panels capture sunlight\n& generate DC power"},
            {"INV",  "2. Inverter\nConversion", "DC converted to AC\nfor home appliances"},
            {"HOME", "3. Home\nUsage",          "Power your home\ndirectly from solar"},
            {"GRID", "4. Net Meter\nExport",    "Excess units exported\nto grid for credit"},
        };
        for (int i = 0; i < 4; i++) {
            float sx = 30 + i * stepW;
            drawFlowStep(cb, sx, stepTopY - stepH, stepW - 6, stepH,
                    steps[i][0], steps[i][1], steps[i][2], i + 1);
            if (i < 3) {
                float ax = sx + stepW - 4, ay = stepTopY - stepH / 2f;
                cb.setColorFill(ORANGE);
                cb.moveTo(ax, ay + 6); cb.lineTo(ax + 10, ay); cb.lineTo(ax, ay - 6);
                cb.closePath(); cb.fill();
            }
        }

        // Documents section
        float secY = stepTopY - stepH - 22;
        fillRound(cb, PRIMARY, 30, secY - 24, PW - 60, 30, 6);
        txt(cb, Element.ALIGN_LEFT,
                new Phrase("  DOCUMENTS REQUIRED  (Gujarat - Net Metering Application)", fWhiteBold(11)),
                38, secY - 8);

        String[][] docs = {
            {"[A]", "Aadhaar / PAN Card"},
            {"[E]", "Electricity Bill"},
            {"[P]", "Property Proof"},
            {"[N]", "NOC (if applicable)"},
            {"[F]", "Net Metering Form"},
            {"[S]", "System Details Sheet"},
        };
        float docW = (PW - 60) / 3f - 5, docH = 52, dsx = 30, dsy = secY - 36;
        for (int i = 0; i < 6; i++) {
            float dx = dsx + (i % 3) * (docW + 7.5f);
            float dy = dsy - (i / 3) * (docH + 8);
            drawDocCard(cb, dx, dy, docW, docH, docs[i][0], docs[i][1]);
        }

        // GEDA note
        float noteY = dsy - 2 * (docH + 8) - 15;
        cb.setColorFill(new Color(255, 244, 220));
        cb.setColorStroke(ORANGE); cb.setLineWidth(1f);
        cb.roundRectangle(30, noteY - 28, PW - 60, 34, 6); cb.fillStroke();
        txt(cb, Element.ALIGN_CENTER,
                new Phrase("Submit documents via GEDA Portal  geda.gujarat.gov.in  for fast subsidy processing",
                        new Font(Font.HELVETICA, 9, Font.BOLD, new Color(120, 60, 0))),
                PW / 2, noteY - 12);

        // --- NEW SUPPLY ITEMS SECTION ---
        float supplyY = noteY - 50; // Start below GEDA note
        fillRound(cb, PRIMARY, 30, supplyY - 24, PW - 60, 30, 6);
        txt(cb, Element.ALIGN_LEFT,
                new Phrase("  SUPPLY ITEMS", fWhiteBold(11)),
                38, supplyY - 8);

        String[][] supplies = {
            {"Inverter", "Ksolare / Solar Yaan (10 year warranty)"},
            {"MCB, CABLE", "HAVELLS / POLYCAB (As per availability)"},
            {"Earthing Kit with Lighting Arrestor", "Premium Make with 5 Years Warranty"},
            {"Solar Mounting Structure", "As per MRE standard (Hot Dip GI pipe)"}
        };

        float sY = supplyY - 36;
        float rowH = 34;
        for (int i = 0; i < supplies.length; i++) {
            cb.setColorFill(Color.WHITE);
            cb.setColorStroke(new Color(210, 220, 245));
            cb.setLineWidth(1f);
            cb.roundRectangle(30, sY - rowH, PW - 60, rowH, 6);
            cb.fillStroke();
            
            // Elegant left accent pill
            fillRound(cb, ORANGE, 34, sY - rowH + 7, 4, 20, 2);
            
            // Text
            txt(cb, Element.ALIGN_LEFT, new Phrase(supplies[i][0], fPrimary(9.5f)), 46, sY - rowH / 2f - 3f);
            txt(cb, Element.ALIGN_LEFT, new Phrase(supplies[i][1], fDark(9f)), 240, sY - rowH / 2f - 3f);
            
            sY -= (rowH + 8);
        }

        bottomStrip(cb,
                "Net Metering takes 30-90 days  |  NRS handles end-to-end process for you",
                "We assist with documentation, inspection & DISCOM coordination");
    }

    private static void drawFlowStep(PdfContentByte cb, float x, float y, float w, float h,
                                     String icon, String title, String desc, int stepNo) {
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(210, 220, 240));
        cb.setLineWidth(1f); cb.roundRectangle(x, y, w, h, 8); cb.fillStroke();
        fillRect(cb, PRIMARY, x, y + h - 52, w, 52);
        // Re-draw rounded top corners over the flat fill
        cb.setColorFill(PRIMARY); cb.roundRectangle(x, y + h - 52, w, 52, 8); cb.fill();
        cb.setColorFill(ORANGE); cb.circle(x + w / 2, y + h - 26, 20); cb.fill();
        txt(cb, Element.ALIGN_CENTER,
                new Phrase(icon, new Font(Font.HELVETICA, 7, Font.BOLD, Color.WHITE)),
                x + w / 2, y + h - 29);
        float ty = y + h - 64;
        for (String part : title.split("\n")) {
            txt(cb, Element.ALIGN_CENTER, new Phrase(part, fPrimary(8)), x + w / 2, ty);
            ty -= 12;
        }
        ty -= 4;
        for (String part : desc.split("\n")) {
            txt(cb, Element.ALIGN_CENTER,
                    new Phrase(part, new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(100, 110, 130))),
                    x + w / 2, ty);
            ty -= 10;
        }
        cb.setColorFill(ORANGE); cb.circle(x + w / 2, y + 14, 10); cb.fill();
        txt(cb, Element.ALIGN_CENTER, new Phrase(String.valueOf(stepNo), fWhiteBold(8)), x + w / 2, y + 10);
    }

    private static void drawDocCard(PdfContentByte cb, float x, float y, float w, float h,
                                    String icon, String label) {
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(210, 220, 245));
        cb.setLineWidth(1f); cb.roundRectangle(x, y - h, w, h, 7); cb.fillStroke();
        fillRect(cb, PRIMARY, x, y - h, w, 4);
        txt(cb, Element.ALIGN_LEFT,
                new Phrase(icon + "  " + label, new Font(Font.HELVETICA, 9, Font.BOLD, DARK)),
                x + 10, y - h / 2 - 4);
    }

    // ======================================================
    // PAGE 5 – FINANCIAL SUMMARY
    // ======================================================
    private void page5(Document doc, PdfWriter writer, SolarQuotation q) throws Exception {

        boolean isResidential = q.getSolarType().equals(ConstantUtils.SOLAR_TYPE_RESIDENTIAL);
        PdfContentByte cb = writer.getDirectContent();
        fillRect(cb, LIGHT_BG, 0, 0, PW, PH);
        pageHeader(cb, "Your Solar Investment Summary",
                "Transparent pricing  |  Maximum subsidy  |  Best value", 5);

        // Dynamic Pricing Cards Layout
        java.util.List<String[]> pCards = new java.util.ArrayList<>();
        pCards.add(new String[]{"TOTAL SYSTEM COST", "Rs." + formatAmt(q.getActualPrice()), "Before deductions", "1"});
        
        if (isResidential) {
            pCards.add(new String[]{"GOVT. SUBSIDY", "Rs." + formatAmt(q.getSubsidy()), "PM Surya Ghar benefit", "2"});
        }
        
        String discomMeter = isResidential ?  "Rs."+ q.getDiscomMeter() : "At Actual";

        pCards.add(new String[]{"DISCOM METER Charge",  discomMeter, "Net Metering Charges", "1"});

        
        if (q.getPqHsCost() > 0) {
            pCards.add(new String[]{"PREMIUM STRUCTURE", "Rs." + formatAmt(q.getPqHsCost()), "Quality & Heighted Cost", "1"});
        }
        
        if (q.getDiscountAmount() > 0) {
            pCards.add(new String[]{"SPECIAL DISCOUNT", "Rs." + formatAmt(q.getDiscountAmount()), "Exclusive Offer Applied", "2"});
        }
        
        pCards.add(new String[]{"YOUR FINAL PAYABLE", "Rs." + formatAmt(isResidential ? q.getEffectivePrice() : q.getActualPrice()), "After all deductions", "3"});

        float pcW = (PW - 60 - 20) / 3f, pcH = 85, pcTopY = PH - 125;
        float row2Y = pcTopY - pcH - 12;

        // Draw Row 1 (up to 3 cards)
        int r1Count = Math.min(3, pCards.size());
        for (int i = 0; i < r1Count; i++) {
            String[] c = pCards.get(i);
            Color bg = c[3].equals("1") ? PRIMARY : (c[3].equals("2") ? GREEN : ORANGE);
            Color acc = c[3].equals("1") ? ORANGE : Color.WHITE;
            drawPriceCard(cb, 30 + i * (pcW + 10), pcTopY - pcH, pcW, pcH, c[0], c[1], c[2], bg, acc);
        }

        // Draw Row 2 (remaining cards)
        int r2Count = pCards.size() - 3;
        if (r2Count > 0) {
            float row2W = (PW - 60 - (r2Count - 1) * 10f) / (float)r2Count;
            for (int i = 0; i < r2Count; i++) {
                String[] c = pCards.get(3 + i);
                Color bg = c[3].equals("1") ? PRIMARY : (c[3].equals("2") ? GREEN : ORANGE);
                Color acc = c[3].equals("1") ? ORANGE : Color.WHITE;
                drawPriceCard(cb, 30 + i * (row2W + 10), row2Y - pcH, row2W, pcH, c[0], c[1], c[2], bg, acc);
            }
        }

        // ROI section
        float roiY = row2Y - pcH - 20;
        fillRound(cb, PRIMARY, 30, roiY - 24, PW - 60, 30, 6);
        txt(cb, Element.ALIGN_LEFT,
                new Phrase("  RETURN ON INVESTMENT (ROI) ESTIMATE", fWhiteBold(10)), 38, roiY - 8);
        float rcW = (PW - 60) / 3f - 5, rcH = 65; // Slightly reduced height
        String[]   roiVals   = {q.getPaybackPeriod(), "Rs.4,50,000+"};
        String[]   roiLabels = {"Payback Period", "25-Year Total Savings"};
        Color[]    roiColors = {ORANGE, GREEN, PRIMARY};
        for (int i = 0; i < roiVals.length; i++) {
            drawRoiCard(cb, 30 + i * (rcW + 7.5f), roiY - 36 - rcH, rcW, rcH,
                    roiVals[i], roiLabels[i], roiColors[i]);
        }


        float emiSecY = roiY - 36 - rcH - 16;
        float ecH = 74; // Slightly reduced height

        // EMI comparison

        if(isResidential){

            fillRound(cb, PRIMARY, 30, emiSecY - 24, PW - 60, 30, 6);
            txt(cb, Element.ALIGN_LEFT,
                    new Phrase("  EMI & PAYMENT OPTIONS", fWhiteBold(10)), 38, emiSecY - 8);
            float ecW = (PW - 60) / 2f - 5;
            drawEmiCard(cb, 30,            emiSecY - 36 - ecH, ecW, ecH,
                    "EMI OPTION", q.getEmiOption(),
                    "Flexible 12-60 month tenure\nZero-cost EMI via NBFCs\nNo hidden charges", ORANGE);
            drawEmiCard(cb, 30 + ecW + 10, emiSecY - 36 - ecH, ecW, ecH,
                    "DIRECT PAYMENT BENEFIT", "Save Rs.12,000 Extra",
                    "One-time payment discount\nFastest installation slot\nPriority subsidy processing", PRIMARY);


        }else{

            fillRound(cb, PRIMARY, 30, emiSecY - 24, PW - 60, 30, 6);
            txt(cb, Element.ALIGN_LEFT,
                    new Phrase(" PAYMENT OPTIONS", fWhiteBold(10)), 38, emiSecY - 8);
            float ecW = (PW - 60) / 2f - 5;
            drawEmiCard(cb, 30,            emiSecY - 36 - ecH, ecW, ecH,
                    "Per Kilowatt price", "26,000",
                    "", ORANGE);
            drawEmiCard(cb, 30 + ecW + 10, emiSecY - 36 - ecH, ecW, ecH,
                    "Per Kilowatt Price(Including GST)", "28,314",
                    "", PRIMARY);

        }




        // Payment schedule strip
        float ptY = emiSecY - 36 - ecH - 16;
        float ptStripH = 54;
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(200, 215, 240));
        cb.setLineWidth(1f); cb.roundRectangle(30, ptY - ptStripH, PW - 60, ptStripH + 8, 8); cb.fillStroke();
        txt(cb, Element.ALIGN_LEFT, new Phrase("PAYMENT SCHEDULE", fPrimary(10)), 42, ptY - 10);

        // Calculate 3 evenly-spaced boxes in the right portion of the strip
        float boxW = 115, boxH = 40, boxGap = 8;
        float totalBoxW = 3 * boxW + 2 * boxGap;
        float boxStartX = PW - 30 - totalBoxW;  // flush to right margin
        String[] ptP = {"20%", "75%", "5%"};
        String[] ptL = {"Advance on Order", "Before Dispatch", "After Commissioning"};
        Color[]  ptC = {PRIMARY, ORANGE, GREEN};
        for (int i = 0; i < 3; i++) {
            float bx = boxStartX + i * (boxW + boxGap);
            float by = ptY - ptStripH + (ptStripH - boxH) / 2f;
            fillRound(cb, ptC[i], bx, by, boxW, boxH, 6);
            txt(cb, Element.ALIGN_CENTER, new Phrase(ptP[i], fWhiteBold(14)), bx + boxW / 2, by + boxH - 14);
            txt(cb, Element.ALIGN_CENTER,
                    new Phrase(ptL[i], new Font(Font.HELVETICA, 7, Font.NORMAL, new Color(220, 230, 255))),
                    bx + boxW / 2, by + 8);
        }

        // --- NEW BANK DETAILS SECTION ---
        float bankSecY = ptY - ptStripH - 24; // Adjusted to fit page
        float bdH = 95; 
        
        // Card Body Background
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(210, 220, 240));
        cb.setLineWidth(1f); cb.roundRectangle(30, bankSecY - bdH, PW - 60, bdH, 8); cb.fillStroke();
        
        // Blue Header for Bank Card
        cb.setColorFill(PRIMARY); cb.roundRectangle(30, bankSecY - 30, PW - 60, 30, 8); cb.fill();
        fillRect(cb, PRIMARY, 30, bankSecY - 30, PW - 60, 15); // Flatten the bottom curve cleanly
        
        txt(cb, Element.ALIGN_LEFT, new Phrase("  OFFICIAL BANK DETAILS", fWhiteBold(11)), 38, bankSecY - 14);
        
        // Hybrid Layout: Full width for long strings, 2-Column for short strings
        float lCol = 50, rCol = PW / 2 + 10;
        float detailY = bankSecY - 44; 
        
        txt(cb, Element.ALIGN_LEFT, new Phrase("Bank Name:", fDark(9.5f)), lCol, detailY);
        txt(cb, Element.ALIGN_LEFT, new Phrase("KALUPUR COMMERCIAL CO-OP BANK LTD", fPrimary(9.5f)), lCol + 80, detailY);
        
        detailY -= 16;
        
        txt(cb, Element.ALIGN_LEFT, new Phrase("Account Name:", fDark(9.5f)), lCol, detailY);
        txt(cb, Element.ALIGN_LEFT, new Phrase("NRS SOLAR SOLUTION", fPrimary(9.5f)), lCol + 80, detailY);
        
        detailY -= 16;
        
        txt(cb, Element.ALIGN_LEFT, new Phrase("Account No:", fDark(9.5f)), lCol, detailY);
        txt(cb, Element.ALIGN_LEFT, new Phrase("01920102458", fPrimary(9.5f)), lCol + 80, detailY);
        
        txt(cb, Element.ALIGN_LEFT, new Phrase("IFSC Code:", fDark(9.5f)), rCol, detailY);
        txt(cb, Element.ALIGN_LEFT, new Phrase("KKCBOISP019", fPrimary(9.5f)), rCol + 65, detailY);
        
        detailY -= 16;
        
        txt(cb, Element.ALIGN_LEFT, new Phrase("Branch:", fDark(9.5f)), lCol, detailY);
        txt(cb, Element.ALIGN_LEFT, new Phrase("ISANPUR AHMEDABAD", fPrimary(9.5f)), lCol + 80, detailY);

        // Bottom CTA
        fillRect(cb, ORANGE, 0, 0, PW, 62);
        fillRect(cb, new Color(220, 60, 0), 0, 59, PW, 3);
        txt(cb, Element.ALIGN_CENTER,
                new Phrase("Book Now  -  Limited PM Surya Ghar Subsidy Available!", fWhiteBold(14)),
                PW / 2, 36);
        txt(cb, Element.ALIGN_CENTER,
                new Phrase("Call / WhatsApp: "+q.getSubmittedNumber()+"  |  www.nrssolarsolution.com",
                        new Font(Font.HELVETICA, 9, Font.NORMAL, new Color(255, 240, 210))),
                PW / 2, 16);
    }

    private static void drawPriceCard(PdfContentByte cb, float x, float y, float w, float h,
                                      String title, String value, String note, Color bg, Color accent) {
        cb.setColorFill(bg); cb.setColorStroke(new Color(180, 200, 225));
        cb.setLineWidth(1f); cb.roundRectangle(x, y, w, h, 10); cb.fillStroke();
        fillRect(cb, accent, x, y + h - 5, w, 5);
        Color sub = new Color(200, 220, 255);
        if (title != null && !title.isEmpty()) {
            txt(cb, Element.ALIGN_CENTER, new Phrase(title, new Font(Font.HELVETICA, 7, Font.BOLD, sub)), x + w / 2, y + h - 20);
        }
        
        if (value.length() > 18) {
            int mid = value.indexOf(' ', value.length() / 2 - 3);
            if (mid == -1) mid = value.length() / 2;
            String line1 = value.substring(0, mid).trim();
            String line2 = value.substring(mid).trim();
            txt(cb, Element.ALIGN_CENTER, new Phrase(line1, new Font(Font.HELVETICA, 13, Font.BOLD, accent)), x + w / 2, y + h / 2 + 12);
            txt(cb, Element.ALIGN_CENTER, new Phrase(line2, new Font(Font.HELVETICA, 13, Font.BOLD, accent)), x + w / 2, y + h / 2 - 6);
        } else {
            txt(cb, Element.ALIGN_CENTER, new Phrase(value, new Font(Font.HELVETICA, 17, Font.BOLD, accent)), x + w / 2, y + h / 2 + 6);
        }

        if (note != null && !note.isEmpty()) {
            txt(cb, Element.ALIGN_CENTER, new Phrase(note,  new Font(Font.HELVETICA, 7, Font.NORMAL, sub)), x + w / 2, y + 10);
        }
    }

    private static void drawRoiCard(PdfContentByte cb, float x, float y, float w, float h,
                                    String value, String label, Color accent) {
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(210, 220, 240));
        cb.setLineWidth(1f); cb.roundRectangle(x, y, w, h, 8); cb.fillStroke();
        fillRect(cb, accent, x, y + h - 5, w, 5);
        txt(cb, Element.ALIGN_CENTER, new Phrase(value, new Font(Font.HELVETICA, 18, Font.BOLD, accent)), x + w / 2, y + h / 2 + 8);
        txt(cb, Element.ALIGN_CENTER, new Phrase(label, new Font(Font.HELVETICA, 8, Font.NORMAL, DARK)),  x + w / 2, y + 10);
    }

    private static void drawEmiCard(PdfContentByte cb, float x, float y, float w, float h,
                                    String title, String value, String bullets, Color accent) {
        cb.setColorFill(Color.WHITE); cb.setColorStroke(new Color(210, 220, 240));
        cb.setLineWidth(1f); cb.roundRectangle(x, y, w, h, 8); cb.fillStroke();
        cb.setColorFill(accent); cb.roundRectangle(x, y + h - 26, w, 26, 8); cb.fill();
        fillRect(cb, accent, x, y + h - 26, w, 13); // flatten bottom of header band
        
        boolean hasBullets = bullets != null && !bullets.trim().isEmpty();
        
        if (hasBullets) {
            txt(cb, Element.ALIGN_LEFT, new Phrase(title, fWhiteBold(8)), x + 10, y + h - 15);
            txt(cb, Element.ALIGN_LEFT, new Phrase(value, new Font(Font.HELVETICA, 13, Font.BOLD, accent)), x + 10, y + h - 40);
            float by = y + h - 54;
            for (String line : bullets.split("\n")) {
                txt(cb, Element.ALIGN_LEFT,
                        new Phrase("* " + line, new Font(Font.HELVETICA, 7, Font.NORMAL, DARK)), x + 10, by);
                by -= 11;
            }
        } else {
            // Center everything and remove dot if no bullets
            txt(cb, Element.ALIGN_CENTER, new Phrase(title, fWhiteBold(9)), x + w / 2, y + h - 17);
            txt(cb, Element.ALIGN_CENTER, new Phrase(value, new Font(Font.HELVETICA, 18, Font.BOLD, accent)), x + w / 2, y + 24);
        }
    }

    // ======================================================
    // QUOTATION DATA PAGE  (original – UNCHANGED)
    // ======================================================
    private static void addQuotationPage(Document document, SolarQuotation quotation) throws Exception {
        ClassPathResource header = new ClassPathResource("static/images/NRS_pdf_header.jpg");
        Image logo = Image.getInstance(header.getInputStream().readAllBytes());
        logo.scaleToFit(480, 90); logo.setAlignment(Image.ALIGN_CENTER);
        document.add(logo);
        document.add(createHalfLineSpace());

        PdfPTable customerSection = new PdfPTable(1);
        customerSection.setWidthPercentage(100);
        customerSection.addCell(getCell("Customer Details", PdfPCell.ALIGN_CENTER, new Color(50, 100, 200), Color.WHITE, true));
        document.add(customerSection);

        PdfPTable customerDetailsTable = new PdfPTable(2);
        customerDetailsTable.setWidthPercentage(100);
        customerDetailsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        customerDetailsTable.addCell(getCell("Customer Name",    PdfPCell.ALIGN_LEFT,  new Color(230, 240, 250), Color.BLACK, true));
        customerDetailsTable.addCell(getCell(quotation.getCustomerName(), PdfPCell.ALIGN_RIGHT, new Color(230, 240, 250), Color.BLACK, true));
        customerDetailsTable.addCell(getCell("Customer Number",  PdfPCell.ALIGN_LEFT,  new Color(230, 240, 250), Color.BLACK, true));
        customerDetailsTable.addCell(getCell(quotation.getCustomerMobileNumber(), PdfPCell.ALIGN_RIGHT, new Color(230, 240, 250), Color.BLACK, true));
        document.add(customerDetailsTable);
        document.add(createHalfLineSpace());

        PdfPTable descTable = new PdfPTable(new float[]{4f, 6f});
        descTable.setWidthPercentage(100); descTable.setSpacingAfter(7f);
        descTable.addCell(getHeaderCell("Description of Supply Item", new Color(230, 240, 250)));
        descTable.addCell(getHeaderCell("Make and Remarks",           new Color(230, 240, 250)));
        descTable.addCell(getCellColumn("Solar PV Modules",                       new Color(245, 245, 245)));
        descTable.addCell(getCellColumn(quotation.getPanelsName() + "\n(As per availability)", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("Inverter",                               new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("Ksolare / Solar Yaan (10 year warranty)", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("MCB, CABLE",                             new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("HAVELLS / POLYCAB (As per availability)",new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("Earthing Kit with Lighting Arrestor",    new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("Premium Make with 5 Years Warranty",     new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("Solar Mounting Structure",               new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("As per MRE standard (Hot Dip GI pipe)",  new Color(245, 245, 245)));
        document.add(descTable);
        document.add(createHalfLineSpace());

        PdfPTable systemTable = new PdfPTable(new float[]{5f, 2f, 3f});
        systemTable.setWidthPercentage(100); systemTable.setSpacingAfter(7f);
        systemTable.addCell(getHeaderCell("Description",             new Color(230, 240, 250)));
        systemTable.addCell(getHeaderCell("Offered System (KW)",     new Color(230, 240, 250)));
        systemTable.addCell(getHeaderCell("Rate/KW (INR, incl GST)", new Color(230, 240, 250)));
        systemTable.addCell(getCellColumn("Supply, erection, and commissioning of solar PV power plant with standard cable length", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn(String.valueOf(quotation.getKw()), new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("Rs." + quotation.getRateKw(),     new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("Discom Meter Charges",            new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("",                               new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("Rs." + quotation.getDiscomMeter(), new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("Premium Quality and Heighted Structure Cost", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("",                               new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("Rs." + quotation.getPqHsCost(),  new Color(245, 245, 245)));
        document.add(systemTable);

        PdfPTable priceTable = new PdfPTable(2);
        priceTable.setWidthPercentage(100); priceTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
        priceTable.addCell(getCell("Customer Actual Payable", PdfPCell.ALIGN_LEFT,  new Color(50, 100, 200), Color.WHITE, true));
        priceTable.addCell(getCell("Rs." + quotation.getActualPrice(), PdfPCell.ALIGN_RIGHT, new Color(50, 100, 200), Color.BLACK, true));
        priceTable.addCell(getCell("Subsidy",                          PdfPCell.ALIGN_LEFT,  Color.LIGHT_GRAY, Color.BLACK, false));
        priceTable.addCell(getCell("Rs." + quotation.getSubsidy(),     PdfPCell.ALIGN_RIGHT, Color.LIGHT_GRAY, Color.BLACK, false));
        if (quotation.getDiscountAmount() > 0) {
            priceTable.addCell(getCell("Special Discount",             PdfPCell.ALIGN_LEFT,  new Color(245, 245, 245), Color.BLACK, true));
            priceTable.addCell(getCell(formatAmount(quotation.getDiscountAmount()), PdfPCell.ALIGN_RIGHT, new Color(245, 245, 245), Color.BLACK, true));
        }
        priceTable.addCell(getCell("Effective Price", PdfPCell.ALIGN_LEFT,  new Color(245, 245, 245), Color.BLACK, true));
        priceTable.addCell(getCell(formatAmount(quotation.getEffectivePrice()), PdfPCell.ALIGN_RIGHT, new Color(245, 245, 245), Color.BLACK, true));
        document.add(priceTable);

        // Bank + Documents side-by-side
        PdfPTable mainBankDocTable = new PdfPTable(new float[]{0.48f, 0.04f, 0.48f});
        mainBankDocTable.setWidthPercentage(100); mainBankDocTable.setSpacingBefore(18f);

        PdfPTable bankTable = new PdfPTable(1);
        bankTable.setWidthPercentage(100); bankTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);
        PdfPCell bkHead = new PdfPCell(new Phrase("BANK DETAIL", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
        bkHead.setBackgroundColor(new Color(0, 51, 102)); bkHead.setPadding(5); bkHead.setBorder(PdfPCell.NO_BORDER);
        bankTable.addCell(bkHead);
        PdfPCell bkBody = new PdfPCell(); bkBody.setBorder(PdfPCell.NO_BORDER); bkBody.setPadding(4);
        bkBody.addElement(new Paragraph("BANK : KALUPUR COMMERCIAL CO-OP BANK LTD", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bkBody.addElement(new Paragraph("NAME : NRS SOLAR SOLUTION",                FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bkBody.addElement(new Paragraph("ACCOUNT NO: 01920102458",                  FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bkBody.addElement(new Paragraph("IFSC CODE: KKCBOISP019",                   FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bkBody.addElement(new Paragraph("BRANCH : ISANPUR AHMEDABAD",               FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bankTable.addCell(bkBody);

        PdfPTable docTable = new PdfPTable(1);
        docTable.setWidthPercentage(100); docTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);
        PdfPCell dkHead = new PdfPCell(new Phrase("Documents Required", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
        dkHead.setBackgroundColor(new Color(0, 51, 102)); dkHead.setPadding(4); dkHead.setBorder(PdfPCell.NO_BORDER);
        docTable.addCell(dkHead);
        PdfPCell dkBody = new PdfPCell(); dkBody.setBorder(PdfPCell.NO_BORDER); dkBody.setPadding(4);
        dkBody.addElement(new Paragraph("1. Light Bill",                 FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        dkBody.addElement(new Paragraph("2. Pan Card",                   FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        dkBody.addElement(new Paragraph("3. Tax bill & index copy",      FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        dkBody.addElement(new Paragraph("4. Aadhar Card",                FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        dkBody.addElement(new Paragraph("5. Cancel Cheque/Bank Details", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        docTable.addCell(dkBody);

        PdfPCell lc = new PdfPCell(bankTable); lc.setBorder(PdfPCell.NO_BORDER); lc.setPadding(0);
        PdfPCell sp = new PdfPCell(new Phrase("")); sp.setBorder(PdfPCell.NO_BORDER); sp.setPadding(0);
        PdfPCell rc = new PdfPCell(docTable);  rc.setBorder(PdfPCell.NO_BORDER); rc.setPadding(0);
        mainBankDocTable.addCell(lc); mainBankDocTable.addCell(sp); mainBankDocTable.addCell(rc);
        document.add(mainBankDocTable);
        document.add(createHalfLineSpace());

        Paragraph footer = new Paragraph(
                "Submitted By: " + quotation.getSubmittedBy() + "   Contact No: " + quotation.getSubmittedNumber(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);
        document.add(createHalfLineSpace());

        PdfPTable ppTable = new PdfPTable(1);
        ppTable.setWidthPercentage(100); ppTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);
        PdfPCell ppHead = new PdfPCell(new Phrase("PRICE AND PAYMENT", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
        ppHead.setBackgroundColor(new Color(0, 51, 102)); ppHead.setPadding(4); ppHead.setBorder(PdfPCell.NO_BORDER);
        ppTable.addCell(ppHead);
        PdfPCell ppBody = new PdfPCell(); ppBody.setBorder(PdfPCell.NO_BORDER); ppBody.setPadding(4);
        ppBody.addElement(new Paragraph("The cost of RTS System will be decided mutually. The Applicant shall pay the total cost to the vendor as under.", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        ppBody.addElement(new Paragraph("20% as an advance on confirmation of the order.",  FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        ppBody.addElement(new Paragraph("75% against Proforma Invoice (PI) before dispatch of solar panels, inverters and other BoS items.", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        ppBody.addElement(new Paragraph("5% after installation and commissioning of the RTS system", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        ppTable.addCell(ppBody);
        document.add(ppTable);
        document.add(createHalfLineSpace());

        ClassPathResource footer2 = new ClassPathResource("static/images/NRS_quts_footer.jpg");
        Image footerImg = Image.getInstance(footer2.getInputStream().readAllBytes());
        footerImg.scaleAbsolute(490f, 9f); footerImg.setAlignment(Image.ALIGN_CENTER);
        document.add(footerImg);
    }

    // ======================================================
    // SHARED HELPERS  (used by addQuotationPage)
    // ======================================================
    private static PdfPCell getHeaderCell(String text, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK)));
        cell.setBackgroundColor(bg); cell.setPadding(8); cell.setBorder(PdfPCell.NO_BORDER);
        cell.setBorderColorBottom(Color.LIGHT_GRAY);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private static PdfPCell getCellColumn(String text, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        cell.setBackgroundColor(bg); cell.setPadding(5); cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private static PdfPCell getCell(String text, int align, Color bg, Color fg, boolean bold) {
        Font f = bold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, fg)
                      : FontFactory.getFont(FontFactory.HELVETICA, 8, fg);
        PdfPCell cell = new PdfPCell(new Phrase(text, f));
        cell.setPadding(4); cell.setBackgroundColor(bg); cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(align); cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private static String formatAmount(double amount) {
        java.text.NumberFormat format = java.text.NumberFormat.getNumberInstance(new java.util.Locale("en", "IN"));
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(2);
        return format.format(amount);
    }
    
    private static String formatAmt(double amount) {
        java.text.NumberFormat format = java.text.NumberFormat.getNumberInstance(new java.util.Locale("en", "IN"));
        format.setMaximumFractionDigits(0);
        return format.format(amount);
    }
}

