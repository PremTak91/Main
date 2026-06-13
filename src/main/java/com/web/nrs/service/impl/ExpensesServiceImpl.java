package com.web.nrs.service.impl;

import com.web.nrs.entity.ExpensesEntity;
import com.web.nrs.repository.ExpensesRepository;
import com.web.nrs.service.ExpensesService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExpensesServiceImpl implements ExpensesService {

    private final ExpensesRepository expensesRepository;

    @Override
    public Page<ExpensesEntity> getAllExpenses(String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Pageable pageable) {
        return expensesRepository.searchAllExpenses(keyword, searchType, startDate, endDate, pageable);
    }

    @Override
    public Page<ExpensesEntity> getExpensesByCreator(Long createdBy, String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Pageable pageable) {
        return expensesRepository.searchByCreator(createdBy, keyword, searchType, startDate, endDate, pageable);
    }

    @Override
    public java.util.List<ExpensesEntity> exportExpenses(String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Long createdBy, boolean isAdmin) {
        if (isAdmin) {
            return expensesRepository.exportAllExpenses(keyword, searchType, startDate, endDate);
        } else {
            return expensesRepository.exportByCreator(createdBy, keyword, searchType, startDate, endDate);
        }
    }

    @Override
    public java.math.BigDecimal getTotalExpenseAmount(String keyword, String searchType, java.time.LocalDate startDate, java.time.LocalDate endDate, Long createdBy, boolean isAdmin) {
        java.math.BigDecimal total;
        if (isAdmin) {
            total = expensesRepository.sumAllExpenses(keyword, searchType, startDate, endDate);
        } else {
            total = expensesRepository.sumByCreator(createdBy, keyword, searchType, startDate, endDate);
        }
        return total != null ? total : java.math.BigDecimal.ZERO;
    }

    @Override
    public ExpensesEntity getExpenseById(Long id) {
        return expensesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
    }

    @Override
    public ExpensesEntity saveExpense(ExpensesEntity expense) {
        return expensesRepository.save(expense);
    }

    @Override
    public void deleteExpense(Long id) {
        if (!expensesRepository.existsById(id)) {
            throw new RuntimeException("Expense not found with id: " + id);
        }
        expensesRepository.deleteById(id);
    }
}
