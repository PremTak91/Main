-- Create companies table
CREATE TABLE IF NOT EXISTS `companies` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default company (ID = 1)
INSERT INTO `companies` (`id`, `name`) VALUES (1, 'NRS Group') ON DUPLICATE KEY UPDATE id=1;

-- Add company_id to tables
ALTER TABLE `employeeinfo` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `user_login` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `inquiry` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `expenses` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `documents` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `work_logs` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `site_details` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `site_photos` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `quotation_logs` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `post_activity` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `post_comments` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `employee_attendance` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `employee_leave` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `manual_timesheet_requests` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `branchmaster` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `designation` ADD COLUMN `company_id` BIGINT DEFAULT 1;
ALTER TABLE `holidays` ADD COLUMN `company_id` BIGINT DEFAULT 1;

-- Add foreign key constraints
ALTER TABLE `employeeinfo` ADD CONSTRAINT `fk_emp_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `user_login` ADD CONSTRAINT `fk_user_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `inquiry` ADD CONSTRAINT `fk_inquiry_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `expenses` ADD CONSTRAINT `fk_expenses_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `documents` ADD CONSTRAINT `fk_documents_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `work_logs` ADD CONSTRAINT `fk_worklogs_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `site_details` ADD CONSTRAINT `fk_sitedetails_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `site_photos` ADD CONSTRAINT `fk_sitephotos_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `quotation_logs` ADD CONSTRAINT `fk_quotation_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `post_activity` ADD CONSTRAINT `fk_post_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `post_comments` ADD CONSTRAINT `fk_comments_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `employee_attendance` ADD CONSTRAINT `fk_attendance_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `employee_leave` ADD CONSTRAINT `fk_leave_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `manual_timesheet_requests` ADD CONSTRAINT `fk_mtr_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `branchmaster` ADD CONSTRAINT `fk_branch_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `designation` ADD CONSTRAINT `fk_designation_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);
ALTER TABLE `holidays` ADD CONSTRAINT `fk_holidays_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`);

-- Add indexes for better tenant isolation performance
CREATE INDEX idx_employeeinfo_company ON `employeeinfo`(`company_id`);
CREATE INDEX idx_user_login_company ON `user_login`(`company_id`);
CREATE INDEX idx_inquiry_company ON `inquiry`(`company_id`);
CREATE INDEX idx_site_details_company ON `site_details`(`company_id`);
