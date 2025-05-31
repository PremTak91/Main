package com.web.nrs.service.impl;

import com.web.nrs.model.SolarQuotation;
import com.web.nrs.service.QuotationService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.*;

import org.springframework.stereotype.Service;

@Service
public class QuotationServiceImpl implements QuotationService{

    // Define a constant for the desired half line leading
    private static final float HALF_LINE_LEADING = 4f; // Adjust this value (in points) as needed

    // Helper method to create a half-line space paragraph
    private Paragraph createHalfLineSpace() {
        Paragraph space = new Paragraph(" ", new Font(Font.NORMAL, 1)); // Use a tiny font size for the space character
        space.setLeading(HALF_LINE_LEADING); // Set the explicit leading
        return space;
    }
	@Override
    public byte[] generateQuotationPdf(SolarQuotation quotation) throws BadElementException, IOException{
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 50, 30);
        PdfWriter.getInstance(document, outputStream);
        document.open();

        // Logo
        Image logo = Image.getInstance("src/main/resources/static/assets/img/NRS_pdf_header.jpg");
        logo.scaleToFit(500, 500);
        logo.setAlignment(Image.ALIGN_CENTER);
        document.add(logo);

        // Title
        Paragraph title = new Paragraph(quotation.getKw() + " Kw "+quotation.getSolarType()+" Solar System", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK)); 
        title.setAlignment(Element.ALIGN_LEFT);
        document.add(title);
        document.add(createHalfLineSpace());

        // Description and Remarks
        PdfPTable descTable = new PdfPTable(new float[]{4f, 6f});
        descTable.setWidthPercentage(100);
        descTable.setSpacingAfter(10f);
        descTable.addCell(getHeaderCell("Description of Supply Item", new Color(230, 240, 250)));
        descTable.addCell(getHeaderCell("Make and Remarks", new Color(230, 240, 250)));
        
        

        descTable.addCell(getCellColumn("Solar PV Modules", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn(quotation.getPanelsName()+"\n(As per availability)", new Color(245, 245, 245)));

        descTable.addCell(getCellColumn("Inverter", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("Ksolare / Solar Yaan(10 year warranty)", new Color(245, 245, 245)));

        descTable.addCell(getCellColumn("MCB, CABLE", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("HAVELLS / POLYCAB (As per availability)", new Color(245, 245, 245)));

        descTable.addCell(getCellColumn("Earthing Kit with Lighting Arrestor", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("Premium Make with 5 Years Warranty", new Color(245, 245, 245)));

        descTable.addCell(getCellColumn("Solar Mounting Structure", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn("As per MRE standard(Hot Dip GI pipe with premium hardware)", new Color(245, 245, 245)));
        document.add(descTable);
        document.add(createHalfLineSpace());

        // System Offer Table
        PdfPTable systemTable = new PdfPTable(new float[]{5f, 2f, 3f});
        systemTable.setWidthPercentage(100);
        descTable.setSpacingAfter(10f);
        systemTable.addCell(getHeaderCell("Description", new Color(230, 240, 250)));
        systemTable.addCell(getHeaderCell("Offered System (KW)", new Color(230, 240, 250)));
        systemTable.addCell(getHeaderCell("Rate/KW (INR, incl GST)", new Color(230, 240, 250)));

        systemTable.addCell(getCellColumn("Supply, erection, and commissioning of solar PV power plant with standard cable length", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn(String.valueOf(quotation.getKw()), new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("₹"+quotation.getRateKw(), new Color(245, 245, 245)));

        systemTable.addCell(getCellColumn("Discom Meter Charges", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("₹"+quotation.getDiscomMeter(), new Color(245, 245, 245)));

        systemTable.addCell(getCellColumn("Premium Quality and Heighted Structure Cost", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("₹"+quotation.getPqHsCost(), new Color(245, 245, 245)));

        document.add(systemTable);

        // Price Breakdown
        PdfPTable priceTable = new PdfPTable(2);
        priceTable.setWidthPercentage(100);
        
        priceTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

        priceTable.addCell(getCell("Customer Actual Payable", PdfPCell.ALIGN_LEFT, new Color(50, 100, 200), Color.WHITE, true));
        priceTable.addCell(getCell("₹" + quotation.getActualPrice(), PdfPCell.ALIGN_RIGHT, new Color(50, 100, 200), Color.BLACK, true));
        priceTable.addCell(getCell("Subsidy", PdfPCell.ALIGN_LEFT, Color.LIGHT_GRAY, Color.BLACK, false));
        priceTable.addCell(getCell("₹" + quotation.getSubsidy(), PdfPCell.ALIGN_RIGHT, Color.LIGHT_GRAY, Color.BLACK, false));
        priceTable.addCell(getCell("Effective Price", PdfPCell.ALIGN_LEFT, new Color(245, 245, 245), Color.BLACK, true));
        priceTable.addCell(getCell(formatAmount(quotation.getEffectivePrice()), PdfPCell.ALIGN_RIGHT, new Color(245, 245, 245), Color.BLACK, true)); 
        
        document.add(priceTable);

        // --- Bank & Document Details (Revised to match image layout) ---
        // Create a main table to hold the two sub-tables side-by-side
        PdfPTable mainBankDocTable = new PdfPTable(new float[]{0.48f, 0.04f, 0.48f}); // Column widths: Bank (left), Spacer, Documents (right)
        mainBankDocTable.setWidthPercentage(100);
        mainBankDocTable.setSpacingBefore(20f); // Space before this main section

        // 1. Create the Bank Details Table
        PdfPTable bankDetailsTable = new PdfPTable(1); // Single column for bank details
        bankDetailsTable.setWidthPercentage(100); // Make it take full width of its cell in main table
        bankDetailsTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);
        bankDetailsTable.setSpacingBefore(0);
        bankDetailsTable.setSpacingAfter(0);

        // Bank Details Header
        PdfPCell bankHeaderCell = new PdfPCell(new Phrase("BANK DETAIL", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
        bankHeaderCell.setBackgroundColor(new Color(0, 51, 102)); // Dark blue [cite: 1]
        bankHeaderCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        bankHeaderCell.setPadding(5);
        bankHeaderCell.setBorder(PdfPCell.NO_BORDER);
        bankDetailsTable.addCell(bankHeaderCell);

        // Bank Details Content (using a cell to manage padding and internal structure)
        PdfPCell bankContentCell = new PdfPCell();
        bankContentCell.setBorder(PdfPCell.NO_BORDER);
        bankContentCell.setPadding(5); // Padding inside this content cell

        bankContentCell.addElement(new Paragraph("BANK : KALUPUR COMMERCIAL CO-OP BANK LTD", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bankContentCell.addElement(new Paragraph("NAME : NRS SOLAR SOLUTION", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bankContentCell.addElement(new Paragraph("ACCOUNT NO: 01920102458", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bankContentCell.addElement(new Paragraph("IFSC CODE: KKCBOISP019", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bankContentCell.addElement(new Paragraph("BRANCH : ISANPUR AHMEDABAD", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        bankDetailsTable.addCell(bankContentCell);

        // 2. Create the Documents Required Table
        PdfPTable docDetailsTable = new PdfPTable(1); // Single column for documents
        docDetailsTable.setWidthPercentage(100); // Make it take full width of its cell in main table
        docDetailsTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);
        docDetailsTable.setSpacingBefore(0);
        docDetailsTable.setSpacingAfter(0);

        // Documents Required Header
        PdfPCell docHeaderCell = new PdfPCell(new Phrase("Documents Required", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
        docHeaderCell.setBackgroundColor(new Color(0, 51, 102)); // Dark blue [cite: 1]
        docHeaderCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        docHeaderCell.setPadding(5);
        docHeaderCell.setBorder(PdfPCell.NO_BORDER);
        docDetailsTable.addCell(docHeaderCell);

        // Documents Required Content
        PdfPCell docContentCell = new PdfPCell();
        docContentCell.setBorder(PdfPCell.NO_BORDER);
        docContentCell.setPadding(5); // Padding inside this content cell

        docContentCell.addElement(new Paragraph("1. Light Bill", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        docContentCell.addElement(new Paragraph("2. Pan Card", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK))); 
        docContentCell.addElement(new Paragraph("3. Taxt bill & index copy", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        docContentCell.addElement(new Paragraph("4. Aadhar Card", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        docContentCell.addElement(new Paragraph("5. Cancel Cheque/Bank Details", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        docDetailsTable.addCell(docContentCell);

        // Add the two tables to the mainBankDocTable
        PdfPCell leftCell = new PdfPCell(bankDetailsTable);
        leftCell.setBorder(PdfPCell.NO_BORDER);
        leftCell.setPadding(0); // No padding on this cell, let the nested table manage it
        mainBankDocTable.addCell(leftCell);

        // Add a spacer cell for the gap between the two tables
        PdfPCell spacerCell = new PdfPCell(new Phrase(""));
        spacerCell.setBorder(PdfPCell.NO_BORDER);
        spacerCell.setPadding(0);
        mainBankDocTable.addCell(spacerCell);

        PdfPCell rightCell = new PdfPCell(docDetailsTable);
        rightCell.setBorder(PdfPCell.NO_BORDER);
        rightCell.setPadding(0); // No padding on this cell
        mainBankDocTable.addCell(rightCell);

        document.add(mainBankDocTable);
        document.add(createHalfLineSpace()); // Consistent half-line space after this section

        // Footer
        Paragraph footer = new Paragraph("Submitted By: "+quotation.getSubmittedBy()+"   Contact No: "+quotation.getSubmittedNumber(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);        
        
        document.add(createHalfLineSpace()); // Consistent half-line space after this section
        
        PdfPTable priceAndPaymentTable = new PdfPTable(1); // Single column for bank details
        priceAndPaymentTable.setWidthPercentage(100); // Make it take full width of its cell in main table
        priceAndPaymentTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);
        priceAndPaymentTable.setSpacingBefore(0);
        priceAndPaymentTable.setSpacingAfter(0);

        PdfPCell priceAndPaymentCell = new PdfPCell(new Phrase("PRICE AND PAYMENT", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.WHITE)));
        priceAndPaymentCell.setBackgroundColor(new Color(0, 51, 102)); // Dark blue [cite: 1]
        priceAndPaymentCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        priceAndPaymentCell.setPadding(5);
        bankHeaderCell.setBorder(PdfPCell.NO_BORDER);
        priceAndPaymentTable.addCell(priceAndPaymentCell);
        
        PdfPCell priceAndPaymentContentCell = new PdfPCell();
        priceAndPaymentContentCell.setBorder(PdfPCell.NO_BORDER);
        priceAndPaymentContentCell.setPadding(5); // Padding inside this content cell

        priceAndPaymentContentCell.addElement(new Paragraph("The cost of RTS System will be_(to be decided mutually). The Applicant shall pay the total cost to the vendor as under.", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        priceAndPaymentContentCell.addElement(new Paragraph("20% as an advance on confirmation of the order.", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        priceAndPaymentContentCell.addElement(new Paragraph("75% against Proforma Invoice (PI) before dispatch of solar panels, inverters and other BoS items to be delivered.", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        priceAndPaymentContentCell.addElement(new Paragraph("5% after installation and commissioning of the RTS system", FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
        priceAndPaymentTable.addCell(priceAndPaymentContentCell);
        document.add(priceAndPaymentTable);
        document.add(createHalfLineSpace());

        Image footerImg = Image.getInstance("src/main/resources/static/assets/img/NRS_quts_footer.jpg");
        footerImg.scaleAbsolute(500f, 10f);
        logo.setAlignment(Image.ALIGN_CENTER);
        document.add(footerImg);

        
        document.close();
        return outputStream.toByteArray();
    }

	 private PdfPCell getHeaderCell(String text, Color bgColor) {
	        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK)));
	        cell.setBackgroundColor(bgColor);
	        cell.setPadding(8);
	        cell.setBorder(PdfPCell.NO_BORDER);
	        cell.setBorderColorBottom(Color.LIGHT_GRAY);
	        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
	        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
	        return cell;
    }
    
	 private PdfPCell getCellColumn(String text, Color bgColor) {
	        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK)));
	        cell.setBackgroundColor(bgColor);
	        cell.setPadding(7);
	        cell.setBorder(PdfPCell.NO_BORDER);
	        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
	        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
	        return cell;
	}

	 private PdfPCell getCell(String text, int alignment, Color backgroudColor, Color textColor, boolean isBold) {
	        Font font = isBold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, textColor) : FontFactory.getFont(FontFactory.HELVETICA, 10, textColor);
	        Phrase phrase = new Phrase(text, font);
	    	PdfPCell cell = new PdfPCell(phrase);
	        cell.setPadding(8);
	        cell.setBackgroundColor(backgroudColor);
	        cell.setBorder(PdfPCell.NO_BORDER);
	        cell.setHorizontalAlignment(alignment);
	        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
	        return cell;
	}

    
    private String formatAmount(double amount) {
        // Formats the amount to Indian Rupees with commas, similar to the PDF.
        return String.format("%,.2f", amount);
    }
}
