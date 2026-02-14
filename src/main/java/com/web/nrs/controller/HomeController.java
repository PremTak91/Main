package com.web.nrs.controller;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.service.PostActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final PostActivityService postActivityService;
    private final EmployeeRepository employeeRepository;

    @GetMapping("/home")
    public String dashboardPage(Model model){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        
        employeeRepository.findEmployeeByEmail(email).ifPresent(emp -> {
            model.addAttribute("currentUserId", emp.getId());
            model.addAttribute("currentUserPhoto", emp.getPhoto());
            model.addAttribute("currentUserName", emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : ""));
        });
        
        model.addAttribute("posts", postActivityService.getAllPostsWithEmployeeDetails());
        return "home";
    }
}
