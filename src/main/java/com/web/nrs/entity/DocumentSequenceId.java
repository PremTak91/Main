package com.web.nrs.entity;

import java.io.Serializable;
import java.util.Objects;

public class DocumentSequenceId implements Serializable {

    private String docType;
    private String financialYear;

    public DocumentSequenceId() {}

    public DocumentSequenceId(String docType, String financialYear) {
        this.docType = docType;
        this.financialYear = financialYear;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DocumentSequenceId)) return false;
        DocumentSequenceId that = (DocumentSequenceId) o;
        return Objects.equals(docType, that.docType) &&
                Objects.equals(financialYear, that.financialYear);
    }

    @Override
    public int hashCode() {
        return Objects.hash(docType, financialYear);
    }
}
