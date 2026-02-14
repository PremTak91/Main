package com.web.nrs.service;

import com.web.nrs.entity.ExpensesEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExpensesService {

    Page<ExpensesEntity> getAllExpenses(Pageable pageable);

    ExpensesEntity getExpenseById(Long id);

    ExpensesEntity saveExpense(ExpensesEntity expense);

    void deleteExpense(Long id);
}
