package com.web.nrs.service;

import com.web.nrs.dto.CompanyDashboardDTO;
import com.web.nrs.entity.CompanyEntity;

public interface CompanyService {
    CompanyEntity createCompany(String name, String adminEmail, String adminPassword);
    CompanyEntity createCompany(java.util.Map<String, String> data);
    CompanyEntity updateCompany(Long id, String name, String status);
    CompanyEntity updateCompany(Long id, java.util.Map<String, String> data);
    CompanyDashboardDTO getCompanyDashboard(Long companyId);
    void updateSubscription(Long companyId, String planExtension, String customEndDate, String status);
    void softDeleteCompany(Long companyId);
    void restoreCompany(Long companyId);
}
