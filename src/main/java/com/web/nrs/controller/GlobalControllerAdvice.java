package com.web.nrs.controller;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class GlobalControllerAdvice {

    private final com.web.nrs.repository.EmployeeRepository employeeRepository;

    public GlobalControllerAdvice(com.web.nrs.repository.EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // This will be available in all Thymeleaf templates
    @ModelAttribute
    public void addGlobalAttributes(org.springframework.ui.Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            String email = auth.getName();
            model.addAttribute("currentUserName", email); // Fallback
            employeeRepository.findEmployeeByEmail(email).ifPresent(emp -> {
                model.addAttribute("currentUserId", emp.getId());
                model.addAttribute("currentUserPhoto", emp.getPhoto());
                model.addAttribute("currentUserName", emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : ""));
            });
        }
    }
}
