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
    public Page<ExpensesEntity> getAllExpenses(Pageable pageable) {
        return expensesRepository.findAll(pageable);
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
