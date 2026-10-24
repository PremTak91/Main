package com.web.nrs.config;

import com.web.nrs.service.CompanyModuleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import java.util.Set;
import java.util.Collections;

@Component
public class ModuleAccessInterceptor implements HandlerInterceptor {

    @Autowired
    private CompanyModuleService moduleService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        Long companyId = TenantContext.getCurrentTenant();
        if (companyId == null) {
            return true;
        }

        Set<String> enabledModules = moduleService.getEnabledModules(companyId);
        request.setAttribute("enabledModules", enabledModules);

        String uri = request.getRequestURI();
        // Remove context path if present (e.g., /NRS)
        String contextPath = request.getContextPath();
        if (uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }

        String requiredModule = getRequiredModule(uri);
        if (requiredModule != null && !enabledModules.contains(requiredModule)) {
            if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With")) || 
                (request.getHeader("Accept") != null && request.getHeader("Accept").contains("application/json"))) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Module " + requiredModule + " is disabled for this company.\"}");
            } else {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Module Disabled");
            }
            return false;
        }

        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        if (modelAndView != null) {
            @SuppressWarnings("unchecked")
            Set<String> enabledModules = (Set<String>) request.getAttribute("enabledModules");
            if (enabledModules == null) enabledModules = Collections.emptySet();
            modelAndView.addObject("enabledModules", enabledModules);
        }
    }

    private String getRequiredModule(String uri) {
        if (uri.startsWith("/employee")) return "EMPLOYEES";
        if (uri.startsWith("/timesheet")) return "ATTENDANCE";
        if (uri.startsWith("/attendance")) return "ATTENDANCE_PUNCH";
        if (uri.startsWith("/post")) return "POST_ACTIVITY";
        if (uri.startsWith("/leave") || uri.startsWith("/leaveRole")) return "LEAVE";
        if (uri.startsWith("/expenses")) return "EXPENSES";
        if (uri.startsWith("/inquiry")) return "INQUIRIES";
        if (uri.startsWith("/quts")) return "QUOTATIONS";
        if (uri.startsWith("/worklogs")) return "WORK_UPDATES";
        if (uri.startsWith("/admin/documents")) return "DOCUMENTS";
        if (uri.startsWith("/sites")) return "SOLAR_SITES";
        return null;
    }
}
