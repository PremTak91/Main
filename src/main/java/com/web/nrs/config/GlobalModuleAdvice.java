package com.web.nrs.config;

import com.web.nrs.entity.CompanySubscriptionEntity;
import com.web.nrs.repository.CompanySubscriptionRepository;
import com.web.nrs.service.CompanyModuleService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

@ControllerAdvice
public class GlobalModuleAdvice {

    @Autowired
    private CompanyModuleService moduleService;

    @Autowired
    private CompanySubscriptionRepository subscriptionRepository;

    @ModelAttribute("enabledModules")
    public Set<String> populateEnabledModules() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId != null) {
            return moduleService.getEnabledModules(companyId);
        }
        return Collections.emptySet();
    }

    @ModelAttribute("subscriptionAlert")
    public SubscriptionAlertDTO populateSubscriptionAlert() {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId != null) {
            Optional<CompanySubscriptionEntity> subOpt = subscriptionRepository.findByCompanyId(companyId);
            if (subOpt.isPresent()) {
                CompanySubscriptionEntity sub = subOpt.get();
                if (sub.getEndDate() != null) {
                    LocalDate today = LocalDate.now();
                    long days = ChronoUnit.DAYS.between(today, sub.getEndDate());
                    if (days <= 15) {
                        return new SubscriptionAlertDTO(true, sub.getEndDate().toString(), Math.max(0, days), days <= 0);
                    }
                }
            }
        }
        return null;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SubscriptionAlertDTO {
        private boolean expiringSoon;
        private String expiryDate;
        private long daysRemaining;
        private boolean expired;
    }
}
