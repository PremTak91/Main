package com.web.nrs;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

@SpringBootTest
class NrsprojectApplicationTests {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void searchFuzzyArif() {
        System.out.println("========== FUZZY SEARCH FOR 'arif' OR 'bolwala' START ==========");
        
        // 1. Search in user_login
        System.out.println("Searching in user_login table:");
        List<Map<String, Object>> loginMatches = jdbcTemplate.queryForList(
                "SELECT username FROM user_login WHERE username LIKE '%arif%' OR username LIKE '%bolwala%'");
        if (loginMatches.isEmpty()) {
            System.out.println(" No matches in user_login");
        } else {
            loginMatches.forEach(m -> System.out.println(" - " + m.get("username")));
        }

        // 2. Search in employeeinfo
        System.out.println("Searching in employeeinfo table:");
        List<Map<String, Object>> empMatches = jdbcTemplate.queryForList(
                "SELECT email FROM employeeinfo WHERE email LIKE '%arif%' OR email LIKE '%bolwala%'");
        if (empMatches.isEmpty()) {
            System.out.println(" No matches in employeeinfo");
        } else {
            empMatches.forEach(m -> System.out.println(" - " + m.get("email")));
        }
        
        System.out.println("========== FUZZY SEARCH END ==========");
    }
}
