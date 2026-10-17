-- Create company_subscriptions table
CREATE TABLE IF NOT EXISTS `company_subscriptions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT NOT NULL,
  `plan_name` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_comp_sub_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill 1 Year subscription for any existing companies automatically
INSERT INTO `company_subscriptions` (`company_id`, `plan_name`, `status`, `start_date`, `end_date`, `created_at`, `updated_at`)
SELECT 
    id, 
    '1 Year', 
    'ACTIVE', 
    DATE(created_at), 
    DATE_ADD(DATE(created_at), INTERVAL 1 YEAR),
    NOW(),
    NOW()
FROM `companies`
WHERE id NOT IN (SELECT company_id FROM `company_subscriptions`);
