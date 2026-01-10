package com.web.nrs.controller;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final EmployeeService employeeService;

    @PostMapping("/punch-in")
    public ResponseEntity<?> punchIn(Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> employeeOpt = employeeService.getEmployeeByEmailId(email);

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Employee not found");
        }

        String result = employeeService.punchIn(employeeOpt.get().getId());
        return ResponseEntity.ok(Map.of("status", result));
    }

    @PostMapping("/punch-out")
    public ResponseEntity<?> punchOut(Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> employeeOpt = employeeService.getEmployeeByEmailId(email);

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Employee not found");
        }

        String result = employeeService.punchOut(employeeOpt.get().getId());
        return ResponseEntity.ok(Map.of("status", result));
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus(Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> employeeOpt = employeeService.getEmployeeByEmailId(email);

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Employee not found");
        }

        String status = employeeService.getAttendanceStatus(employeeOpt.get().getId());
        return ResponseEntity.ok(Map.of("status", status));
    }
}
