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
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpensesController {

    private final ExpensesService expensesService;

    @GetMapping
    public String viewExpensePage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Model model
    ) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, sortDir);
        Page<ExpensesEntity> expensesPage = expensesService.getAllExpenses(pageable);

        model.addAttribute("expenses", expensesPage.getContent());
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", expensesPage.getTotalPages());
        model.addAttribute("totalItems", expensesPage.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("sortBy", sortBy);
        model.addAttribute("sortDir", sortDir);
        model.addAttribute("reverseSortDir", sortDir.equals("asc") ? "desc" : "asc");

        return "expenses";
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
            ExpensesEntity expense = mapRequestToEntity(request, new ExpensesEntity());
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
            ExpensesEntity existing = expensesService.getExpenseById(id);
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
            expensesService.deleteExpense(id);
            return ResponseEntity.ok(ApiResponse.success("Expense deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private ExpensesEntity mapRequestToEntity(Map<String, Object> request, ExpensesEntity expense) {
        if (request.containsKey("description")) {
            expense.setDescription(request.get("description").toString());
        }
        if (request.containsKey("totalAmount") && request.get("totalAmount") != null) {
            expense.setTotalAmount(new BigDecimal(request.get("totalAmount").toString()));
        }
        if (request.containsKey("advancedAmount") && request.get("advancedAmount") != null) {
            expense.setAdvancedAmount(new BigDecimal(request.get("advancedAmount").toString()));
        }
        if (request.containsKey("expenseDate") && request.get("expenseDate") != null) {
            expense.setExpenseDate(LocalDate.parse(request.get("expenseDate").toString()));
        }
        if (request.containsKey("givenBy")) {
            expense.setGivenBy(request.get("givenBy").toString());
        }
        if (request.containsKey("givenTo")) {
            expense.setGivenTo(request.get("givenTo").toString());
        }
        if (request.containsKey("expenseType")) {
            expense.setExpenseType(request.get("expenseType").toString());
        }
        return expense;
    }
}
