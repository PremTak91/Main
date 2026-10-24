ALTER TABLE `companies` 
ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN `deleted_at` DATETIME NULL;


INSERT IGNORE INTO `company_modules` (`company_id`, `module_code`, `enabled`)
SELECT c.id, m.module_code, TRUE
FROM `companies` c
         CROSS JOIN (
    SELECT 'ATTENDANCE_PUNCH' as module_code UNION ALL
    SELECT 'POST_ACTIVITY' UNION ALL
    SELECT 'INQUIRIES' UNION ALL
    SELECT 'WORK_UPDATES' UNION ALL
    SELECT 'DOCUMENTS'
) m;