package com.web.nrs.controller;

import com.web.nrs.entity.ExpensesEntity;
import com.web.nrs.service.ExpensesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
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
    public ResponseEntity<ExpensesEntity> getExpenseById(@PathVariable Long id) {
        try {
            ExpensesEntity expense = expensesService.getExpenseById(id);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createExpense(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            ExpensesEntity expense = mapRequestToEntity(request, new ExpensesEntity());
            expensesService.saveExpense(expense);

            response.put("success", true);
            response.put("message", "Expense added successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateExpense(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            ExpensesEntity existing = expensesService.getExpenseById(id);
            mapRequestToEntity(request, existing);
            expensesService.saveExpense(existing);

            response.put("success", true);
            response.put("message", "Expense updated successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteExpense(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            expensesService.deleteExpense(id);
            response.put("success", true);
            response.put("message", "Expense deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
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
