package com.web.nrs.service;

import com.web.nrs.entity.ExpensesEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExpensesService {

    Page<ExpensesEntity> getAllExpenses(String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Pageable pageable);
    Page<ExpensesEntity> getExpensesByCreator(Long createdBy, String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Pageable pageable);

    java.util.List<ExpensesEntity> exportExpenses(String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Long createdBy, boolean isAdmin);

    java.math.BigDecimal getTotalExpenseAmount(String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Long createdBy, boolean isAdmin);

    ExpensesEntity getExpenseById(Long id);

    ExpensesEntity saveExpense(ExpensesEntity expense);

    void deleteExpense(Long id);
}
