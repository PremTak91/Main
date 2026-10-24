package com.web.nrs.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class CompanyViewController {

    @GetMapping("/companies")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public String companiesPage() {
        return "companies";
    }

    @GetMapping("/companies/{id}/dashboard")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public String companyDashboardPage() {
        return "company-dashboard";
    }
}
