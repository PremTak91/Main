package com.web.nrs;

import com.web.nrs.dto.CompanyDashboardDTO;
import com.web.nrs.entity.CompanyEntity;
import com.web.nrs.entity.CompanyModuleEntity;
import com.web.nrs.entity.CompanySubscriptionEntity;
import com.web.nrs.repository.CompanyModuleRepository;
import com.web.nrs.repository.CompanyRepository;
import com.web.nrs.repository.CompanySubscriptionRepository;
import com.web.nrs.service.CompanyModuleService;
import com.web.nrs.service.CompanyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PhaseVerificationTest {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private CompanySubscriptionRepository subscriptionRepository;

    @Autowired
    private CompanyModuleService moduleService;

    @Autowired
    private CompanyModuleRepository moduleRepository;

    @Test
    @Transactional
    @DisplayName("Verify Full Company 360 Lifecycle: Creation, Subscriptions, Modules, Soft Delete")
    void testCompany360FullLifecycle() {
        // 1. Create a Company (Verifying Phase 1, Phase 2 default subscription, Phase 3 default modules)
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        String companyName = "Test Solar " + uniqueSuffix;
        String adminEmail = "admin_" + uniqueSuffix + "@testsolar.com";

        CompanyEntity created = companyService.createCompany(companyName, adminEmail, "Password@123");
        assertNotNull(created.getId(), "Company ID must be generated");
        assertEquals("ACTIVE", created.getStatus());
        assertFalse(created.isDeleted(), "New company must not be soft-deleted");

        Long companyId = created.getId();

        // 2. Verify Subscription Creation (Phase 2)
        CompanySubscriptionEntity sub = subscriptionRepository.findByCompanyId(companyId).orElse(null);
        assertNotNull(sub, "Default subscription should be automatically created");
        assertEquals("1 Year", sub.getPlanName());
        assertEquals("ACTIVE", sub.getStatus());
        assertEquals(LocalDate.now(), sub.getStartDate());
        assertEquals(LocalDate.now().plusYears(1), sub.getEndDate());

        // Test Subscription extension
        companyService.updateSubscription(companyId, "6 Months", null, "ACTIVE");
        CompanySubscriptionEntity updatedSub = subscriptionRepository.findByCompanyId(companyId).orElse(null);
        assertNotNull(updatedSub);
        assertEquals("6 Months", updatedSub.getPlanName());

        // 3. Verify Module Initialization (Phase 3)
        List<CompanyModuleEntity> modules = moduleService.getAllModules(companyId);
        assertFalse(modules.isEmpty(), "Default modules must be provisioned");
        assertTrue(moduleService.getEnabledModules(companyId).contains("EMPLOYEES"));
        assertTrue(moduleService.getEnabledModules(companyId).contains("EXPENSES"));

        // Test disabling a module
        Map<String, Boolean> moduleUpdates = new HashMap<>();
        moduleUpdates.put("EXPENSES", false);
        moduleService.updateModules(companyId, moduleUpdates);
        assertFalse(moduleService.getEnabledModules(companyId).contains("EXPENSES"), "EXPENSES module should now be disabled");
        assertTrue(moduleService.getEnabledModules(companyId).contains("EMPLOYEES"), "EMPLOYEES module should remain enabled");

        // 4. Verify Dashboard Retrieval (Phase 1, Phase 2, Phase 3, Phase 6)
        CompanyDashboardDTO dashboard = companyService.getCompanyDashboard(companyId);
        assertNotNull(dashboard);
        assertEquals(companyName, dashboard.getCompany().getName());
        assertNotNull(dashboard.getSubscription());
        assertEquals("6 Months", dashboard.getSubscription().getPlanName());
        assertNotNull(dashboard.getModules());
        assertNotNull(dashboard.getRecentActivities(), "Recent activity list should be instantiated");
        assertNotNull(dashboard.getLastLogin(), "Last login should be populated");
        assertNotNull(dashboard.getLastActivity(), "Last activity should be populated");

        // 5. Verify Company Status Deactivation & Reactivation (Phase 4)
        companyService.updateCompany(companyId, null, "INACTIVE");
        CompanyEntity inactiveCompany = companyRepository.findById(companyId).orElse(null);
        assertNotNull(inactiveCompany);
        assertEquals("INACTIVE", inactiveCompany.getStatus());

        companyService.updateCompany(companyId, null, "ACTIVE");
        CompanyEntity activeCompany = companyRepository.findById(companyId).orElse(null);
        assertNotNull(activeCompany);
        assertEquals("ACTIVE", activeCompany.getStatus());

        // 6. Verify Safe Soft Delete & Restore (Phase 5)
        companyService.softDeleteCompany(companyId);
        CompanyEntity deletedCompany = companyRepository.findById(companyId).orElse(null);
        assertNotNull(deletedCompany);
        assertTrue(deletedCompany.isDeleted());
        assertNotNull(deletedCompany.getDeletedAt());

        // Ensure soft deleted company is excluded from active listings
        List<CompanyEntity> activeList = companyRepository.findByDeletedFalse();
        boolean foundInActive = activeList.stream().anyMatch(c -> c.getId().equals(companyId));
        assertFalse(foundInActive, "Soft-deleted company must NOT appear in normal listing");

        // Restore Company
        companyService.restoreCompany(companyId);
        CompanyEntity restored = companyRepository.findById(companyId).orElse(null);
        assertNotNull(restored);
        assertFalse(restored.isDeleted());
        assertNull(restored.getDeletedAt());
    }
}
