package com.web.nrs.dto;

import com.web.nrs.entity.CompanyEntity;
import lombok.Data;

@Data
public class CompanyDashboardDTO {
    private CompanyEntity company;
    private AdminUserDTO primaryAdmin;
    private long totalEmployees;
    private long activeUsers;
    private long solarSites;
    private long quotations;
    private long expenses;
    private long pendingLeaves;
    private long quotationsThisMonth;
    private long expensesThisMonth;
    private String lastLogin;
    private String lastActivity;
    private SubscriptionDTO subscription;
    private java.util.List<ModuleDTO> modules;
    private java.util.List<ActivityDTO> recentActivities;
    private boolean deleted;
    
    @Data
    public static class AdminUserDTO {
        private Long id;
        private String username;
        private String loginTime;
    }

    @Data
    public static class SubscriptionDTO {
        private Long id;
        private String planName;
        private String status;
        private String startDate;
        private String endDate;
        private long daysRemaining;
    }

    @Data
    public static class ModuleDTO {
        private String code;
        private boolean enabled;
    }

    @Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class ActivityDTO {
        private String description;
        private String type;
        private String timestamp;
        private String icon;
        private String badgeClass;
    }
}
