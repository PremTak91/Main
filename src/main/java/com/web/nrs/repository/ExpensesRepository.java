package com.web.nrs.repository;

import com.web.nrs.entity.ExpensesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface ExpensesRepository extends JpaRepository<ExpensesEntity, Long> {
    
    // For normal user view
    Page<ExpensesEntity> findByCreatedByAndCreatedAtAfter(Long createdBy, LocalDateTime startOfDay, Pageable pageable);

    // Search for admin
    @Query("SELECT e FROM ExpensesEntity e WHERE " +
           "(:startDate IS NULL OR e.expenseDate >= :startDate) AND " +
           "(:endDate IS NULL OR e.expenseDate <= :endDate) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  (:searchType = 'ALL' AND (LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'NAME' AND (LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'TYPE' AND LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
           "  (:searchType = 'DESC' AND LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           ")")
    Page<ExpensesEntity> searchAllExpenses(@Param("keyword") String keyword, 
                                           @Param("searchType") String searchType, 
                                           @Param("startDate") java.time.LocalDate startDate, 
                                           @Param("endDate") java.time.LocalDate endDate, 
                                           Pageable pageable);

    // Search for normal user
    @Query("SELECT e FROM ExpensesEntity e WHERE e.createdBy = :createdBy AND e.createdAt >= :startOfDay AND " +
           "(:startDate IS NULL OR e.expenseDate >= :startDate) AND " +
           "(:endDate IS NULL OR e.expenseDate <= :endDate) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  (:searchType = 'ALL' AND (LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'NAME' AND (LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'TYPE' AND LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
           "  (:searchType = 'DESC' AND LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           ")")
    Page<ExpensesEntity> searchByCreatorAndDate(@Param("createdBy") Long createdBy, 
                                                @Param("startOfDay") LocalDateTime startOfDay, 
                                                @Param("keyword") String keyword, 
                                                @Param("searchType") String searchType, 
                                                @Param("startDate") java.time.LocalDate startDate, 
                                                @Param("endDate") java.time.LocalDate endDate, 
                                                Pageable pageable);

    // Export for admin
    @Query("SELECT e FROM ExpensesEntity e WHERE " +
           "(:startDate IS NULL OR e.expenseDate >= :startDate) AND " +
           "(:endDate IS NULL OR e.expenseDate <= :endDate) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  (:searchType = 'ALL' AND (LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'NAME' AND (LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'TYPE' AND LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
           "  (:searchType = 'DESC' AND LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           ") ORDER BY e.id DESC")
    List<ExpensesEntity> exportAllExpenses(@Param("keyword") String keyword, 
                                           @Param("searchType") String searchType, 
                                           @Param("startDate") java.time.LocalDate startDate, 
                                           @Param("endDate") java.time.LocalDate endDate);

    // Export for normal user
    @Query("SELECT e FROM ExpensesEntity e WHERE e.createdBy = :createdBy AND e.createdAt >= :startOfDay AND " +
           "(:startDate IS NULL OR e.expenseDate >= :startDate) AND " +
           "(:endDate IS NULL OR e.expenseDate <= :endDate) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  (:searchType = 'ALL' AND (LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'NAME' AND (LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'TYPE' AND LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
           "  (:searchType = 'DESC' AND LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           ") ORDER BY e.id DESC")
    List<ExpensesEntity> exportByCreatorAndDate(@Param("createdBy") Long createdBy, 
                                                @Param("startOfDay") LocalDateTime startOfDay, 
                                                @Param("keyword") String keyword, 
                                                @Param("searchType") String searchType, 
                                                @Param("startDate") java.time.LocalDate startDate, 
                                                @Param("endDate") java.time.LocalDate endDate);

    // Sum for admin
    @Query("SELECT SUM(e.totalAmount) FROM ExpensesEntity e WHERE " +
           "(:startDate IS NULL OR e.expenseDate >= :startDate) AND " +
           "(:endDate IS NULL OR e.expenseDate <= :endDate) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  (:searchType = 'ALL' AND (LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'NAME' AND (LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'TYPE' AND LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
           "  (:searchType = 'DESC' AND LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           ")")
    java.math.BigDecimal sumAllExpenses(@Param("keyword") String keyword, 
                                        @Param("searchType") String searchType, 
                                        @Param("startDate") java.time.LocalDate startDate, 
                                        @Param("endDate") java.time.LocalDate endDate);

    // Sum for normal user
    @Query("SELECT SUM(e.totalAmount) FROM ExpensesEntity e WHERE e.createdBy = :createdBy AND e.createdAt >= :startOfDay AND " +
           "(:startDate IS NULL OR e.expenseDate >= :startDate) AND " +
           "(:endDate IS NULL OR e.expenseDate <= :endDate) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           "  (:searchType = 'ALL' AND (LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'NAME' AND (LOWER(e.givenBy) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(e.givenTo) LIKE LOWER(CONCAT('%', :keyword, '%')))) OR " +
           "  (:searchType = 'TYPE' AND LOWER(e.expenseType) LIKE LOWER(CONCAT('%', :keyword, '%'))) OR " +
           "  (:searchType = 'DESC' AND LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')))" +
           ")")
    java.math.BigDecimal sumByCreatorAndDate(@Param("createdBy") Long createdBy, 
                                             @Param("startOfDay") LocalDateTime startOfDay, 
                                             @Param("keyword") String keyword, 
                                             @Param("searchType") String searchType, 
                                             @Param("startDate") java.time.LocalDate startDate, 
                                             @Param("endDate") java.time.LocalDate endDate);
}
