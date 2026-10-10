package com.web.nrs.service.impl;

import com.web.nrs.entity.CompanyEntity;
import com.web.nrs.entity.LoginEntity;
import com.web.nrs.entity.RoleEntity;
import com.web.nrs.entity.UserRoleEntity;
import com.web.nrs.entity.UserRoleId;
import com.web.nrs.repository.CompanyRepository;
import com.web.nrs.repository.LoginRepository;
import com.web.nrs.repository.RoleRepository;
import com.web.nrs.service.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class CompanyServiceImpl implements CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private LoginRepository loginRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.web.nrs.repository.EmployeeRepository employeeRepository;

    @Autowired
    private com.web.nrs.repository.SiteDetailsRepository siteDetailsRepository;

    @Autowired
    private com.web.nrs.repository.QuotationLogRepository quotationLogRepository;

    @Autowired
    private com.web.nrs.repository.ExpensesRepository expensesRepository;

    @Autowired
    private com.web.nrs.repository.EmployeeLeaveRepository employeeLeaveRepository;

    @Autowired
    private com.web.nrs.repository.CompanySubscriptionRepository companySubscriptionRepository;

    @Autowired
    private com.web.nrs.service.CompanyModuleService companyModuleService;

    @Override
    @Transactional
    public CompanyEntity createCompany(String name, String adminEmail, String adminPassword) {
        // 1. Create Company (Factory step 1)
        CompanyEntity company = new CompanyEntity();
        company.setName(name);
        company.setStatus("ACTIVE");
        company = companyRepository.save(company);

        // 2. Create Admin Login (Factory step 2)
        LoginEntity adminLogin = new LoginEntity();
        adminLogin.setUsername(adminEmail);
        adminLogin.setPassword(passwordEncoder.encode(adminPassword));
        adminLogin.setCompanyId(company.getId());
        adminLogin.setCustomId(UUID.randomUUID().toString());
        loginRepository.save(adminLogin);

        // 3. Assign ADMIN role
        Optional<RoleEntity> adminRoleOpt = roleRepository.findByRoleId("ADMIN");
        if (adminRoleOpt.isPresent()) {
            RoleEntity adminRole = adminRoleOpt.get();
            UserRoleEntity userRole = new UserRoleEntity();
            UserRoleId userRoleId = new UserRoleId();
            userRoleId.setUserId(adminLogin.getId());
            userRoleId.setRoleId(adminRole.getId());
            
            userRole.setId(userRoleId);
            userRole.setUser(adminLogin);
            userRole.setRoles(adminRole);
            
            adminLogin.getUserRoles().add(userRole);
            loginRepository.save(adminLogin);
        }

        // 4. Create default 1 Year Subscription
        com.web.nrs.entity.CompanySubscriptionEntity subscription = new com.web.nrs.entity.CompanySubscriptionEntity();
        subscription.setCompanyId(company.getId());
        subscription.setPlanName("1 Year");
        subscription.setStatus("ACTIVE");
        subscription.setStartDate(java.time.LocalDate.now());
        subscription.setEndDate(java.time.LocalDate.now().plusYears(1));
        companySubscriptionRepository.save(subscription);
        
        // 5. Initialize default modules
        companyModuleService.createDefaultModules(company.getId());

        return company;
    }

    @Override
    @Transactional
    public CompanyEntity updateCompany(Long id, String name, String status) {
        CompanyEntity company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        if (name != null) company.setName(name);
        if (status != null) company.setStatus(status);
        return companyRepository.save(company);
    }

    @Override
    @Transactional(readOnly = true)
    public com.web.nrs.dto.CompanyDashboardDTO getCompanyDashboard(Long companyId) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        com.web.nrs.dto.CompanyDashboardDTO dto = new com.web.nrs.dto.CompanyDashboardDTO();
        dto.setCompany(company);
        dto.setDeleted(company.isDeleted());

        // Fetch primary admin
        loginRepository.findAll().stream()
                .filter(l -> l.getCompanyId() != null && l.getCompanyId().equals(companyId))
                .filter(l -> l.getUserRoles().stream().anyMatch(ur -> "ADMIN".equals(ur.getRoles().getRoleId())))
                .findFirst()
                .ifPresent(admin -> {
                    com.web.nrs.dto.CompanyDashboardDTO.AdminUserDTO adminDto = new com.web.nrs.dto.CompanyDashboardDTO.AdminUserDTO();
                    adminDto.setId(admin.getId());
                    adminDto.setUsername(admin.getUsername());
                    adminDto.setLoginTime(admin.getLoginTime() != null ? admin.getLoginTime().toString() : null);
                    dto.setPrimaryAdmin(adminDto);
                });

        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        java.util.List<com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO> activities = new java.util.ArrayList<>();

        // 1. User logins for this company (tenant-isolated by companyId)
        java.util.List<LoginEntity> companyLogins = loginRepository.findTop5ByCompanyIdOrderByLoginTimeDesc(companyId);
        if (!companyLogins.isEmpty() && companyLogins.get(0).getLoginTime() != null) {
            dto.setLastLogin(dtf.format(companyLogins.get(0).getLoginTime().toLocalDateTime()));
        } else {
            dto.setLastLogin("Never");
        }
        for (LoginEntity login : companyLogins) {
            if (login.getLoginTime() != null) {
                LocalDateTime time = login.getLoginTime().toLocalDateTime();
                activities.add(com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO.builder()
                        .description("User logged in: " + login.getUsername())
                        .type("LOGIN")
                        .timestamp(dtf.format(time))
                        .icon("fas fa-sign-in-alt")
                        .badgeClass("bg-primary")
                        .build());
            }
        }

        // Switch TenantContext securely to get stats
        Long previousTenant = com.web.nrs.config.TenantContext.getCurrentTenant();
        try {
            com.web.nrs.config.TenantContext.setCurrentTenant(companyId);
            
            // Efficient aggregate queries
            dto.setTotalEmployees(employeeRepository.count());
            dto.setSolarSites(siteDetailsRepository.count());
            dto.setQuotations(quotationLogRepository.count());
            dto.setExpenses(expensesRepository.count());
            dto.setPendingLeaves(employeeLeaveRepository.countPendingLeaves());
            dto.setActiveUsers(loginRepository.countByCompanyId(companyId));

            java.time.LocalDateTime startOfMonth = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
            dto.setQuotationsThisMonth(quotationLogRepository.countQuotationsSince(startOfMonth));
            dto.setExpensesThisMonth(expensesRepository.countExpensesSince(startOfMonth));

            // 2. Employees (Recent)
            for (com.web.nrs.entity.EmployeeEntity emp : employeeRepository.findTop5ByOrderByIdDesc()) {
                LocalDateTime time = emp.getAuditTimeStamp() != null ? emp.getAuditTimeStamp() : (company.getCreatedAt() != null ? company.getCreatedAt() : LocalDateTime.now());
                String action = emp.getAuditTimeStamp() != null ? "Employee updated" : "Employee onboarded";
                activities.add(com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO.builder()
                        .description(action + ": " + emp.getFullName() + (emp.getEmail() != null ? " (" + emp.getEmail() + ")" : ""))
                        .type("EMPLOYEE")
                        .timestamp(dtf.format(time))
                        .icon("fas fa-user-check")
                        .badgeClass("bg-info text-dark")
                        .build());
            }

            // 3. Solar Sites (Recent)
            for (com.web.nrs.entity.SiteDetailsEntity site : siteDetailsRepository.findTop5ByOrderByCreatedAtDesc()) {
                LocalDateTime time = site.getCreatedAt() != null ? site.getCreatedAt() : LocalDateTime.now();
                activities.add(com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO.builder()
                        .description("Solar Site created: " + site.getCustomerName() + " (" + site.getSiteStatus() + ")")
                        .type("SOLAR_SITE")
                        .timestamp(dtf.format(time))
                        .icon("fas fa-solar-panel")
                        .badgeClass("bg-warning text-dark")
                        .build());
            }

            // 4. Quotations (Recent)
            for (com.web.nrs.entity.QuotationLogEntity q : quotationLogRepository.findTop5ByOrderByCreatedDateDesc()) {
                LocalDateTime time = q.getCreatedDate() != null ? q.getCreatedDate() : LocalDateTime.now();
                activities.add(com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO.builder()
                        .description("Quotation generated: #" + q.getQuotationNo() + " for " + q.getCustomerName())
                        .type("QUOTATION")
                        .timestamp(dtf.format(time))
                        .icon("fas fa-file-invoice-dollar")
                        .badgeClass("bg-success")
                        .build());
            }

            // 5. Expenses (Recent)
            for (com.web.nrs.entity.ExpensesEntity exp : expensesRepository.findTop5ByOrderByCreatedAtDesc()) {
                LocalDateTime time = exp.getCreatedAt() != null ? exp.getCreatedAt() : LocalDateTime.now();
                activities.add(com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO.builder()
                        .description("Expense submitted: " + exp.getExpenseType() + " (₹" + exp.getTotalAmount() + ")")
                        .type("EXPENSE")
                        .timestamp(dtf.format(time))
                        .icon("fas fa-receipt")
                        .badgeClass("bg-secondary")
                        .build());
            }

            // 6. Leaves (Recent)
            for (com.web.nrs.entity.EmployeeLeaveEntity leave : employeeLeaveRepository.findTop5ByOrderByCreatedAtDesc()) {
                LocalDateTime time = leave.getCreatedAt() != null ? leave.getCreatedAt() : LocalDateTime.now();
                String action = "Approved".equalsIgnoreCase(leave.getStatus()) ? "Leave approved" : "Leave requested";
                activities.add(com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO.builder()
                        .description(action + ": " + (leave.getLeaveDescription() != null ? leave.getLeaveDescription() : "Employee Leave") + " [" + leave.getStatus() + "]")
                        .type("LEAVE")
                        .timestamp(dtf.format(time))
                        .icon("fas fa-calendar-check")
                        .badgeClass("bg-danger")
                        .build());
            }

        } finally {
            com.web.nrs.config.TenantContext.setCurrentTenant(previousTenant);
        }

        // 7. Company Configuration Changed
        if (company.getUpdatedAt() != null) {
            activities.add(com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO.builder()
                    .description("Company configuration updated")
                    .type("CONFIG")
                    .timestamp(dtf.format(company.getUpdatedAt()))
                    .icon("fas fa-cog")
                    .badgeClass("bg-dark")
                    .build());
        }

        // Sort activities descending by timestamp
        activities.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        java.util.List<com.web.nrs.dto.CompanyDashboardDTO.ActivityDTO> topActivities = activities.stream()
                .limit(10)
                .collect(java.util.stream.Collectors.toList());
        dto.setRecentActivities(topActivities);

        if (!topActivities.isEmpty()) {
            dto.setLastActivity(topActivities.get(0).getTimestamp());
        } else {
            dto.setLastActivity("No recent activity");
        }

        // Fetch subscription
        companySubscriptionRepository.findByCompanyId(companyId).ifPresent(sub -> {
            com.web.nrs.dto.CompanyDashboardDTO.SubscriptionDTO subDto = new com.web.nrs.dto.CompanyDashboardDTO.SubscriptionDTO();
            subDto.setId(sub.getId());
            subDto.setPlanName(sub.getPlanName());
            
            java.time.LocalDate today = java.time.LocalDate.now();
            long days = java.time.temporal.ChronoUnit.DAYS.between(today, sub.getEndDate());
            
            String dynamicStatus = sub.getStatus();
            if ("ACTIVE".equals(dynamicStatus)) {
                if (days < 0) dynamicStatus = "EXPIRED";
                else if (days <= 30) dynamicStatus = "EXPIRING_SOON";
            }
            
            subDto.setStatus(dynamicStatus);
            subDto.setStartDate(sub.getStartDate().toString());
            subDto.setEndDate(sub.getEndDate().toString());
            subDto.setDaysRemaining(days < 0 ? 0 : days);
            dto.setSubscription(subDto);
        });

        // Fetch modules
        java.util.List<com.web.nrs.dto.CompanyDashboardDTO.ModuleDTO> moduleDTOs = companyModuleService.getAllModules(companyId).stream()
                .map(m -> {
                    com.web.nrs.dto.CompanyDashboardDTO.ModuleDTO mdto = new com.web.nrs.dto.CompanyDashboardDTO.ModuleDTO();
                    mdto.setCode(m.getModuleCode());
                    mdto.setEnabled(m.isEnabled());
                    return mdto;
                })
                .collect(java.util.stream.Collectors.toList());
        dto.setModules(moduleDTOs);

        return dto;
    }

    @Override
    @Transactional
    public void updateSubscription(Long companyId, String planExtension, String customEndDate, String status) {
        com.web.nrs.entity.CompanySubscriptionEntity sub = companySubscriptionRepository.findByCompanyId(companyId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        if (status != null && !status.isEmpty()) {
            sub.setStatus(status);
        }

        java.time.LocalDate newEnd = sub.getEndDate();
        if (newEnd.isBefore(java.time.LocalDate.now())) {
            newEnd = java.time.LocalDate.now(); // Start extension from today if already expired
        }

        if (planExtension != null && !planExtension.isEmpty() && !"NONE".equals(planExtension)) {
            switch (planExtension) {
                case "1 Month":
                    newEnd = newEnd.plusMonths(1);
                    break;
                case "3 Months":
                    newEnd = newEnd.plusMonths(3);
                    break;
                case "6 Months":
                    newEnd = newEnd.plusMonths(6);
                    break;
                case "1 Year":
                    newEnd = newEnd.plusYears(1);
                    break;
                case "2 Years":
                    newEnd = newEnd.plusYears(2);
                    break;
                case "Custom":
                    if (customEndDate != null && !customEndDate.isEmpty()) {
                        newEnd = java.time.LocalDate.parse(customEndDate);
                    }
                    break;
            }
            sub.setPlanName(planExtension);
            sub.setEndDate(newEnd);
            sub.setStatus("ACTIVE"); // reset to active if extending
        }

        companySubscriptionRepository.save(sub);
    }

    @Override
    @Transactional
    public void softDeleteCompany(Long companyId) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        company.setDeleted(true);
        company.setDeletedAt(java.time.LocalDateTime.now());
        companyRepository.save(company);
    }

    @Override
    @Transactional
    public void restoreCompany(Long companyId) {
        CompanyEntity company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        company.setDeleted(false);
        company.setDeletedAt(null);
        companyRepository.save(company);
    }
}
