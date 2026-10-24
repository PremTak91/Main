-- ============================================================================
-- Migration: Add Company Basic Information, Branding, Bank Details & Copyright
-- Database: nrsdb
-- Table: companies
-- ============================================================================

-- 1. Add new columns to the `companies` table (if they do not already exist)
ALTER TABLE `companies`
    ADD COLUMN IF NOT EXISTS `logo` VARCHAR(500) NULL AFTER `status`,
    ADD COLUMN IF NOT EXISTS `email` VARCHAR(150) NULL AFTER `logo`,
    ADD COLUMN IF NOT EXISTS `phone` VARCHAR(50) NULL AFTER `email`,
    ADD COLUMN IF NOT EXISTS `website` VARCHAR(150) NULL AFTER `phone`,
    ADD COLUMN IF NOT EXISTS `address` TEXT NULL AFTER `website`,
    ADD COLUMN IF NOT EXISTS `tagline` VARCHAR(255) NULL AFTER `address`,
    ADD COLUMN IF NOT EXISTS `copyright_text` VARCHAR(255) NULL AFTER `tagline`,
    ADD COLUMN IF NOT EXISTS `bank_name` VARCHAR(150) NULL AFTER `copyright_text`,
    ADD COLUMN IF NOT EXISTS `account_name` VARCHAR(150) NULL AFTER `bank_name`,
    ADD COLUMN IF NOT EXISTS `account_no` VARCHAR(100) NULL AFTER `account_name`,
    ADD COLUMN IF NOT EXISTS `ifsc_code` VARCHAR(50) NULL AFTER `account_no`,
    ADD COLUMN IF NOT EXISTS `branch` VARCHAR(100) NULL AFTER `ifsc_code`,
    ADD COLUMN IF NOT EXISTS `policy_doc` VARCHAR(500) NULL AFTER `branch`;

-- 2. Populate default values for Company 1 (NRS Group / NRS Solar Solution)
UPDATE `companies`
SET 
    `logo` = '/images/NRS_brand.png',
    `email` = 'info.nrssolarsolution@gmail.com',
    `phone` = '+91-8866389038',
    `website` = 'www.nrssolarsolution.com',
    `address` = 'HP petrol pump, Shyam business park, 12, Aslali, Ahmedabad, Gujarat 382427',
    `tagline` = 'Your Trusted Solar Partner in Gujarat',
    `copyright_text` = 'Copyright © 2026 NRS Group. All rights reserved.',
    `bank_name` = 'KALUPUR COMMERCIAL CO-OP BANK LTD',
    `account_name` = 'NRS SOLAR SOLUTION',
    `account_no` = '01920102458',
    `ifsc_code` = 'KCCBOISP019',
    `branch` = 'ISANPUR AHMEDABAD'
WHERE `id` = 1;

-- 3. Populate default values for Company 3 (NRS Software / Demo Company)
UPDATE `companies`
SET 
    `logo` = '/images/nrslogo.png',
    `email` = 'support@nrssoftware.com',
    `phone` = '+91-8866389038',
    `website` = 'www.nrssoftware.com',
    `address` = 'Ahmedabad, Gujarat, India',
    `tagline` = 'Next-Gen Enterprise Solutions',
    `copyright_text` = 'Copyright © 2026 NRS Software. All rights reserved.',
    `bank_name` = 'KALUPUR COMMERCIAL CO-OP BANK LTD',
    `account_name` = 'NRS SOFTWARE',
    `account_no` = '01920102458',
    `ifsc_code` = 'KCCBOISP019',
    `branch` = 'ISANPUR AHMEDABAD'
WHERE `id` = 3;
