-- Create company_modules table
CREATE TABLE IF NOT EXISTS `company_modules` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT NOT NULL,
  `module_code` VARCHAR(50) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_module` (`company_id`, `module_code`),
  CONSTRAINT `fk_comp_mod_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill existing companies with all core modules ENABLED by default
INSERT IGNORE INTO `company_modules` (`company_id`, `module_code`, `enabled`)
SELECT c.id, m.module_code, TRUE
FROM `companies` c
CROSS JOIN (
    SELECT 'EMPLOYEES' as module_code UNION ALL
    SELECT 'ATTENDANCE' UNION ALL
    SELECT 'LEAVE' UNION ALL
    SELECT 'EXPENSES' UNION ALL
    SELECT 'QUOTATIONS' UNION ALL
    SELECT 'SOLAR_SITES'
) m;
