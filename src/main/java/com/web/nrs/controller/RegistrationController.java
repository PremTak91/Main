package com.web.nrs.controller;

import com.web.nrs.model.EmployeeRegistrationRequest;
import com.web.nrs.service.EmployeeService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequestMapping("/registration")
@AllArgsConstructor
public class RegistrationController {

    private final EmployeeService employeeService;

    @GetMapping()
    public String registrationPage(Model model) {
        model.addAttribute("rolesList", employeeService.getAllRoles());
        model.addAttribute("designationList", employeeService.getAllDesignation());
        return "registration";
    }

    @PostMapping()
    public ResponseEntity<?> registerEmployee(
            @ModelAttribute EmployeeRegistrationRequest employeeDetails) {

         employeeService.save(employeeDetails);

         return ResponseEntity.ok("Employee registered successfully");
    }
}
