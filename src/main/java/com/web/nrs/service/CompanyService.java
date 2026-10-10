package com.web.nrs.service;

import com.web.nrs.dto.CompanyDashboardDTO;
import com.web.nrs.entity.CompanyEntity;

public interface CompanyService {
    CompanyEntity createCompany(String name, String adminEmail, String adminPassword);
    CompanyEntity updateCompany(Long id, String name, String status);
    CompanyDashboardDTO getCompanyDashboard(Long companyId);
    void updateSubscription(Long companyId, String planExtension, String customEndDate, String status);
    void softDeleteCompany(Long companyId);
    void restoreCompany(Long companyId);
}
