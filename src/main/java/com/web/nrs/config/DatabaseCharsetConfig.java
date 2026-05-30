package com.web.nrs.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseCharsetConfig implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Modify the specific columns explicitly to be sure
            jdbcTemplate.execute("ALTER TABLE post_activity MODIFY post_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            jdbcTemplate.execute("ALTER TABLE post_comments MODIFY comment_text TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            
            System.out.println("✅ Successfully updated database character sets to utf8mb4!");
        } catch (Exception e) {
            System.err.println("⚠️ Could not update character set. Tables might not exist yet or user lacks ALTER permissions: " + e.getMessage());
        }
    }
}
