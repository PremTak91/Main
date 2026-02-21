package com.web.nrs.controller;

import com.web.nrs.utils.ApiResponse;
import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final EmployeeService employeeService;

    @PostMapping("/punch-in")
    public ResponseEntity<ApiResponse> punchIn(Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> employeeOpt = employeeService.getEmployeeByEmailId(email);

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Employee not found"));
        }

        String result = employeeService.punchIn(employeeOpt.get().getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/punch-out")
    public ResponseEntity<ApiResponse> punchOut(Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> employeeOpt = employeeService.getEmployeeByEmailId(email);

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Employee not found"));
        }

        String result = employeeService.punchOut(employeeOpt.get().getId());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse> getStatus(Authentication authentication) {
        String email = authentication.getName();
        Optional<EmployeeEntity> employeeOpt = employeeService.getEmployeeByEmailId(email);

        if (employeeOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Employee not found"));
        }

        String status = employeeService.getAttendanceStatus(employeeOpt.get().getId());
        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
