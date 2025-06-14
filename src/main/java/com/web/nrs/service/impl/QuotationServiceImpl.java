package com.web.nrs.service.impl;

import com.web.nrs.model.SolarQuotation;
import com.web.nrs.service.QuotationService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.springframework.stereotype.Service;

@Service
public class QuotationServiceImpl implements QuotationService {

    // Define a constant for the desired smaller line leading
    private static final float HALF_LINE_LEADING = 3f; // Reduced to save vertical space

    // Helper method to create a small space paragraph
    private Paragraph createHalfLineSpace() {
        Paragraph space = new Paragraph(" ", new Font(Font.NORMAL, 0.1f)); // Use a tiny font size
        space.setLeading(HALF_LINE_LEADING); // Set the explicit leading
        return space;
    }

    @Override
    public byte[] generateQuotationPdf(SolarQuotation quotation) throws BadElementException, IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        // Reduced margins: left, right, top, bottom
        Document document = new Document(PageSize.A4, 30, 30, 40, 20); // Top: 40, Bottom: 20
        PdfWriter.getInstance(document, outputStream);
        document.open();

        // Logo (Header Image)
        Image logo = Image.getInstance("src/main/resources/static/images/NRS_pdf_header.jpg");
        // Scale to fit width, while maintaining aspect ratio. Max width ~530 for A4 with 30mm margins.
        logo.scaleToFit(500, 500); // Adjusted max height to control vertical space
        logo.setAlignment(Image.ALIGN_CENTER);
        document.add(logo);
        document.add(createHalfLineSpace()); // Add a small space after logo

        // Title (e.g., "5 Kw Residential Solar System")
        // Date (aligned right) and Title (aligned left)
        PdfPTable headerLineTable = new PdfPTable(2); // Two columns
        headerLineTable.setWidthPercentage(100); // Take full width
        headerLineTable.setSpacingAfter(createHalfLineSpace().getLeading()); // Add space after this table
        
        // Left Cell for the Solar System Title
        PdfPCell leftTitleCell = new PdfPCell(new Phrase(
            quotation.getKw() + " Kw " + quotation.getSolarType() + " Solar System",
            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK)
        ));
        leftTitleCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        leftTitleCell.setBorder(PdfPCell.NO_BORDER);
        leftTitleCell.setPadding(0); // Remove default cell padding

        // Right Cell for the Date
        String createDate = null != quotation.getCreatedDate() && quotation.getCreatedDate().trim().length() > 0 ?
            quotation.getCreatedDate() : "";

        PdfPCell rightDateCell = new PdfPCell(new Phrase(
            createDate,
            FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK)
        ));
        rightDateCell.setHorizontalAlignment(Element.ALIGN_RIGHT); // Align date to the right
        rightDateCell.setBorder(PdfPCell.NO_BORDER);
        rightDateCell.setPadding(0); // Remove default cell padding

        headerLineTable.addCell(leftTitleCell);
        headerLineTable.addCell(rightDateCell);
        document.add(headerLineTable);      
        document.add(createHalfLineSpace()); // Add a small space after title

        // Customer Name and Address Table
        if ((null != quotation.getCustomerName() && quotation.getCustomerName().trim().length() > 0)
                && (null != quotation.getCustomerAddress() && quotation.getCustomerAddress().trim().length() > 0)) {
            PdfPTable customerTable = new PdfPTable(new float[]{3f, 7f}); // Adjusted column widths
            customerTable.setWidthPercentage(100);
            customerTable.setSpacingAfter(5f); // Reduced space after table

            
            customerTable.addCell(getCell("Customer Name", PdfPCell.ALIGN_LEFT, new Color(245, 245, 245), Color.BLACK, true));
            customerTable.addCell(getCellColumn(quotation.getCustomerName(), new Color(245, 245, 245)));

            customerTable.addCell(getCell("Customer Address", PdfPCell.ALIGN_LEFT, new Color(245, 245, 245), Color.BLACK, true));
            customerTable.addCell(getCellColumn(quotation.getCustomerAddress(), new Color(245, 245, 245)));

            document.add(customerTable);
            document.add(createHalfLineSpace()); // Add a small space after customer table
        }


        // Description and Remarks Table
        PdfPTable descTable = new PdfPTable(new float[]{4f, 6f});
        descTable.setWidthPercentage(100);
        descTable.setSpacingAfter(5f); // Reduced space after table

        descTable.addCell(getHeaderCell("Description of Supply Item", new Color(230, 240, 250)));
        descTable.addCell(getHeaderCell("Make and Remarks", new Color(230, 240, 250)));

        descTable.addCell(getCellColumn("Solar PV Modules", new Color(245, 245, 245)));
        descTable.addCell(getCellColumn(quotation.getPanelsName() + "\n(As per availability)", new Color(245, 245, 245)));

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
        systemTable.setSpacingAfter(5f); // Reduced space after table

        systemTable.addCell(getHeaderCell("Description", new Color(230, 240, 250)));
        systemTable.addCell(getHeaderCell("Offered System (KW)", new Color(230, 240, 250)));
        systemTable.addCell(getHeaderCell("Rate/KW (INR, incl GST)", new Color(230, 240, 250)));

        systemTable.addCell(getCellColumn("Supply, erection, and commissioning of solar PV power plant with standard cable length", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn(String.valueOf(quotation.getKw()), new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("₹" + quotation.getRateKw(), new Color(245, 245, 245)));

        systemTable.addCell(getCellColumn("Discom Meter Charges", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("₹" + quotation.getDiscomMeter(), new Color(245, 245, 245)));

        systemTable.addCell(getCellColumn("Premium Quality and Heighted Structure Cost", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("", new Color(245, 245, 245)));
        systemTable.addCell(getCellColumn("₹" + quotation.getPqHsCost(), new Color(245, 245, 245)));

        document.add(systemTable);
        document.add(createHalfLineSpace()); // Small space after system table

        // Price Breakdown
        PdfPTable priceTable = new PdfPTable(2);
        priceTable.setWidthPercentage(100);
        priceTable.setSpacingAfter(5f); // Reduced space after table

        // No need for setHorizontalAlignment(Element.ALIGN_RIGHT) here, cells handle alignment
        priceTable.addCell(getCell("Customer Actual Payable", PdfPCell.ALIGN_LEFT, new Color(50, 100, 200), Color.WHITE, true));
        priceTable.addCell(getCell("₹" + quotation.getActualPrice(), PdfPCell.ALIGN_RIGHT, new Color(50, 100, 200), Color.BLACK, true));
        priceTable.addCell(getCell("Subsidy", PdfPCell.ALIGN_LEFT, Color.LIGHT_GRAY, Color.BLACK, false));
        priceTable.addCell(getCell("₹" + quotation.getSubsidy(), PdfPCell.ALIGN_RIGHT, Color.LIGHT_GRAY, Color.BLACK, false));
        priceTable.addCell(getCell("Effective Price", PdfPCell.ALIGN_LEFT, new Color(245, 245, 245), Color.BLACK, true));
        priceTable.addCell(getCell(formatAmount(quotation.getEffectivePrice()), PdfPCell.ALIGN_RIGHT, new Color(245, 245, 245), Color.BLACK, true));

        document.add(priceTable);
        document.add(createHalfLineSpace());

        // --- Bank & Document Details ---
        PdfPTable mainBankDocTable = new PdfPTable(new float[]{0.48f, 0.04f, 0.48f});
        mainBankDocTable.setWidthPercentage(100);
        mainBankDocTable.setSpacingBefore(10f); // Reduced space before this section
        mainBankDocTable.setSpacingAfter(5f); // Added space after this section

        // 1. Bank Details Table
        PdfPTable bankDetailsTable = new PdfPTable(1);
        bankDetailsTable.setWidthPercentage(100);
        bankDetailsTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);

        PdfPCell bankHeaderCell = new PdfPCell(new Phrase("BANK DETAIL", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE))); // Reduced font size
        bankHeaderCell.setBackgroundColor(new Color(0, 51, 102));
        bankHeaderCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        bankHeaderCell.setPadding(4); // Reduced padding
        bankHeaderCell.setBorder(PdfPCell.NO_BORDER);
        bankDetailsTable.addCell(bankHeaderCell);

        PdfPCell bankContentCell = new PdfPCell();
        bankContentCell.setBorder(PdfPCell.NO_BORDER);
        bankContentCell.setPadding(4); // Reduced padding

        bankContentCell.addElement(new Paragraph("BANK : KALUPUR COMMERCIAL CO-OP BANK LTD", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK))); // Reduced font size
        bankContentCell.addElement(new Paragraph("NAME : NRS SOLAR SOLUTION", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        bankContentCell.addElement(new Paragraph("ACCOUNT NO: 01920102458", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        bankContentCell.addElement(new Paragraph("IFSC CODE: KKCBOISP019", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        bankContentCell.addElement(new Paragraph("BRANCH : ISANPUR AHMEDABAD", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        bankDetailsTable.addCell(bankContentCell);

        // 2. Documents Required Table
        PdfPTable docDetailsTable = new PdfPTable(1);
        docDetailsTable.setWidthPercentage(100);
        docDetailsTable.getDefaultCell().setBorder(PdfPCell.NO_BORDER);

        PdfPCell docHeaderCell = new PdfPCell(new Phrase("Documents Required", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE))); // Reduced font size
        docHeaderCell.setBackgroundColor(new Color(0, 51, 102));
        docHeaderCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        docHeaderCell.setPadding(4); // Reduced padding
        docHeaderCell.setBorder(PdfPCell.NO_BORDER);
        docDetailsTable.addCell(docHeaderCell);

        PdfPCell docContentCell = new PdfPCell();
        docContentCell.setBorder(PdfPCell.NO_BORDER);
        docContentCell.setPadding(4); // Reduced padding

        docContentCell.addElement(new Paragraph("1. Light Bill", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK))); // Reduced font size
        docContentCell.addElement(new Paragraph("2. Pan Card", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        docContentCell.addElement(new Paragraph("3. Tax bill & index copy", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        docContentCell.addElement(new Paragraph("4. Aadhar Card", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        docContentCell.addElement(new Paragraph("5. Cancel Cheque/Bank Details", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        docDetailsTable.addCell(docContentCell);

        // Add the two tables to the mainBankDocTable
        PdfPCell leftCell = new PdfPCell(bankDetailsTable);
        leftCell.setBorder(PdfPCell.NO_BORDER);
        leftCell.setPadding(0);
        mainBankDocTable.addCell(leftCell);

        PdfPCell spacerCell = new PdfPCell(new Phrase(""));
        spacerCell.setBorder(PdfPCell.NO_BORDER);
        spacerCell.setPadding(0);
        mainBankDocTable.addCell(spacerCell);

        PdfPCell rightCell = new PdfPCell(docDetailsTable);
        rightCell.setBorder(PdfPCell.NO_BORDER);
        rightCell.setPadding(0);
        mainBankDocTable.addCell(rightCell);

        document.add(mainBankDocTable);
        document.add(createHalfLineSpace());

        Paragraph footer = new Paragraph("Submitted By: "+quotation.getSubmittedBy()+"   Contact No: "+quotation.getSubmittedNumber(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.BLACK));
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer); 
        document.add(createHalfLineSpace());
        
        // Price and Payment Section
        PdfPTable priceAndPaymentTable = new PdfPTable(1);
        priceAndPaymentTable.setWidthPercentage(100);
        priceAndPaymentTable.setSpacingAfter(5f); // Reduced spacing after table

        PdfPCell priceAndPaymentHeaderCell = new PdfPCell(new Phrase("PRICE AND PAYMENT", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE))); // Reduced font size
        priceAndPaymentHeaderCell.setBackgroundColor(new Color(0, 51, 102));
        priceAndPaymentHeaderCell.setHorizontalAlignment(Element.ALIGN_LEFT);
        priceAndPaymentHeaderCell.setPadding(4); // Reduced padding
        priceAndPaymentHeaderCell.setBorder(PdfPCell.NO_BORDER); // Fix: this cell had bankHeaderCell.setBorder(PdfPCell.NO_BORDER)
        priceAndPaymentTable.addCell(priceAndPaymentHeaderCell);

        PdfPCell priceAndPaymentContentCell = new PdfPCell();
        priceAndPaymentContentCell.setBorder(PdfPCell.NO_BORDER);
        priceAndPaymentContentCell.setPadding(4); // Reduced padding

        priceAndPaymentContentCell.addElement(new Paragraph("The cost of RTS System will be_(to be decided mutually). The Applicant shall pay the total cost to the vendor as under.", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK))); // Reduced font size
        priceAndPaymentContentCell.addElement(new Paragraph("20% as an advance on confirmation of the order.", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        priceAndPaymentContentCell.addElement(new Paragraph("75% against Proforma Invoice (PI) before dispatch of solar panels, inverters and other BoS items to be delivered.", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        priceAndPaymentContentCell.addElement(new Paragraph("5% after installation and commissioning of the RTS system", FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK)));
        priceAndPaymentTable.addCell(priceAndPaymentContentCell);
        document.add(priceAndPaymentTable);
        document.add(createHalfLineSpace());


        // Footer (Image)
        Image footerImg = Image.getInstance("src/main/resources/static/images/NRS_quts_footer.jpg");
        footerImg.scaleAbsolute(530f, 35f); // Scaled to full width and a fixed small height
        footerImg.setAlignment(Image.ALIGN_CENTER);
        document.add(footerImg);


        document.close();
        return outputStream.toByteArray();
    }

    private PdfPCell getHeaderCell(String text, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK))); // Reduced font size
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6); // Reduced padding
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setBorderColorBottom(Color.LIGHT_GRAY);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private PdfPCell getCellColumn(String text, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK))); // Reduced font size
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6); // Reduced padding
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private PdfPCell getCell(String text, int alignment, Color backgroudColor, Color textColor, boolean isBold) {
        Font font = isBold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, textColor) : FontFactory.getFont(FontFactory.HELVETICA, 9, textColor); // Reduced font size
        Phrase phrase = new Phrase(text, font);
        PdfPCell cell = new PdfPCell(phrase);
        cell.setPadding(6); // Reduced padding
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