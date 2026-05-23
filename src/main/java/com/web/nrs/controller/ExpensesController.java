package com.web.nrs.controller;

import com.web.nrs.utils.ApiResponse;
import com.web.nrs.utils.PaginationUtils;
import com.web.nrs.entity.ExpensesEntity;
import com.web.nrs.service.ExpensesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Controller
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpensesController {

    private final ExpensesService expensesService;
    private final com.web.nrs.service.EmployeeService employeeService;
    private final com.web.nrs.repository.EmployeeRepository employeeRepository;

    @GetMapping
    public String viewExpensePage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String searchType,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate,
            Model model
    ) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        
        // Security check
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));
        
        Long employeeId = employeeService.getEmployeeByEmailId(auth.getName())
                    .map(com.web.nrs.entity.EmployeeEntity::getId)
                    .orElse(0L);

        Page<ExpensesEntity> expensesPage;
        if (isAdmin) {
            expensesPage = expensesService.getAllExpenses(keyword, searchType, startDate, endDate, pageable);
        } else {
            // Non-admin can only see their own entries from today
            expensesPage = expensesService.getExpensesByCreatorAndDate(employeeId, LocalDate.now().atStartOfDay(), keyword, searchType, startDate, endDate, pageable);
        }

        model.addAttribute("expenses", expensesPage.getContent());
        model.addAttribute("isAdmin", isAdmin);
        model.addAttribute("currentEmployeeId", employeeId);
        model.addAttribute("today", LocalDate.now());

        // Calculate and add Total Amount based on search
        java.math.BigDecimal totalAmount = expensesService.getTotalExpenseAmount(keyword, searchType, startDate, endDate, employeeId, isAdmin);
        model.addAttribute("totalExpenseAmount", totalAmount);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", expensesPage.getTotalPages());
        model.addAttribute("totalItems", expensesPage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");
        model.addAttribute("keyword", keyword);
        model.addAttribute("searchType", searchType);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);

        return "expenses";
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportExpenses(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "ALL") String searchType,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate endDate
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));
        
        Long employeeId = employeeService.getEmployeeByEmailId(auth.getName())
                .map(com.web.nrs.entity.EmployeeEntity::getId)
                .orElse(0L);

        java.util.List<ExpensesEntity> expenses = expensesService.exportExpenses(keyword, searchType, startDate, endDate, employeeId, isAdmin);

        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,Description,Amount,Advanced Amount,Given By,Given To,Date,Type\n");

        for (ExpensesEntity e : expenses) {
            csvBuilder.append(e.getId()).append(",")
                      .append("\"").append(e.getDescription() != null ? e.getDescription().replace("\"", "\"\"") : "").append("\",")
                      .append(e.getTotalAmount() != null ? e.getTotalAmount() : "").append(",")
                      .append(e.getAdvancedAmount() != null ? e.getAdvancedAmount() : "").append(",")
                      .append("\"").append(e.getGivenBy() != null ? e.getGivenBy().replace("\"", "\"\"") : "").append("\",")
                      .append("\"").append(e.getGivenTo() != null ? e.getGivenTo().replace("\"", "\"\"") : "").append("\",")
                      .append(e.getExpenseDate() != null ? e.getExpenseDate().toString() : "").append(",")
                      .append("\"").append(e.getExpenseType() != null ? e.getExpenseType().replace("\"", "\"\"") : "").append("\"\n");
        }

        byte[] csvBytes = csvBuilder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"expenses.csv\"")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(csvBytes);
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> getExpenseById(@PathVariable Long id) {
        try {
            ExpensesEntity expense = expensesService.getExpenseById(id);
            return ResponseEntity.ok(ApiResponse.success("Expense fetched", expense));
        } catch (Exception e) {
            return ResponseEntity.status(404).body(ApiResponse.error("Expense not found"));
        }
    }

    @PostMapping
    @ResponseBody
    public ResponseEntity<ApiResponse> createExpense(@RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            Long employeeId = employeeService.getEmployeeByEmailId(auth.getName())
                    .map(com.web.nrs.entity.EmployeeEntity::getId)
                    .orElseThrow(() -> new RuntimeException("Logged in employee not found"));

            ExpensesEntity expense = mapRequestToEntity(request, new ExpensesEntity());
            expense.setCreatedBy(employeeId);
            expensesService.saveExpense(expense);
            return ResponseEntity.ok(ApiResponse.success("Expense added successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> updateExpense(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));
            
            ExpensesEntity existing = expensesService.getExpenseById(id);
            
            if (!isAdmin) {
                Long employeeId = employeeService.getEmployeeByEmailId(auth.getName())
                        .map(com.web.nrs.entity.EmployeeEntity::getId)
                        .orElse(0L);
                
                // Only allow edit if it's their own entry and it was created today
                if (!existing.getCreatedBy().equals(employeeId)) {
                    return ResponseEntity.status(403).body(ApiResponse.error("You can only edit your own entries"));
                }
                if (existing.getCreatedAt().toLocalDate().isBefore(LocalDate.now())) {
                    return ResponseEntity.status(403).body(ApiResponse.error("You can only edit entries on the same day they were created"));
                }
            }
            
            mapRequestToEntity(request, existing);
            expensesService.saveExpense(existing);
            return ResponseEntity.ok(ApiResponse.success("Expense updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<ApiResponse> deleteExpense(@PathVariable Long id) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_SUPERADMIN"));
            
            if (!isAdmin) {
                return ResponseEntity.status(403).body(ApiResponse.error("Only administrators can delete entries"));
            }
            
            expensesService.deleteExpense(id);
            return ResponseEntity.ok(ApiResponse.success("Expense deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private ExpensesEntity mapRequestToEntity(Map<String, Object> request, ExpensesEntity expense) {
        if (request.get("description") != null) {
            expense.setDescription(request.get("description").toString());
        }
        if (request.get("totalAmount") != null) {
            expense.setTotalAmount(new BigDecimal(request.get("totalAmount").toString()));
        }
        if (request.get("advancedAmount") != null) {
            expense.setAdvancedAmount(new BigDecimal(request.get("advancedAmount").toString()));
        }
        if (request.get("expenseDate") != null) {
            expense.setExpenseDate(LocalDate.parse(request.get("expenseDate").toString()));
        }
        if (request.get("givenBy") != null) {
            expense.setGivenBy(request.get("givenBy").toString());
        }
        if (request.get("givenTo") != null) {
            expense.setGivenTo(request.get("givenTo").toString());
        }
        if (request.get("expenseType") != null) {
            expense.setExpenseType(request.get("expenseType").toString());
        }
        return expense;
    }
}
