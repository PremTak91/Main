package com.web.nrs.controller;

import com.web.nrs.DTO.EmployeeDTO;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.model.EmployeeRegistrationRequest;
import com.web.nrs.security.JwtUtil;
import com.web.nrs.service.EmployeeService;
import com.web.nrs.utils.ValidationUtils;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Controller
@AllArgsConstructor
public class ProfileController {

    private final EmployeeService employeeService;


    @GetMapping("/profile")
    public String viewProfilePage(Model model){
        String email= JwtUtil.getUserEmailFromToken();
        EmployeeDTO employeeDTO =employeeService.getProfileDetailsByEmailId(email);
        model.addAttribute("emp", employeeDTO);
        return "profileUpdate";
    }

    @PostMapping("/profile")
    public ResponseEntity<?> updateEmployeeProfile(@ModelAttribute EmployeeRegistrationRequest employeeDetails,
                                                   @RequestParam(value = "photo", required = false) MultipartFile photo, Model model){
        EmployeeEntity employee = employeeService.findEmployeeById(employeeDetails.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        employeeService.updateEmployee(employee, employeeDetails, photo);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        return ResponseEntity.ok(response);
    }
}
