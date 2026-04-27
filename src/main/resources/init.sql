-- MySQL dump 10.13  Distrib 8.0.32, for Win64 (x86_64)
--
-- Host: localhost    Database: nrsdb
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `blcsheet`
--

DROP TABLE IF EXISTS `blcsheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blcsheet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_desc` varchar(256) DEFAULT NULL,
  `total_amt` float DEFAULT NULL,
  `advance_amt` float DEFAULT NULL,
  `entrydate` datetime DEFAULT NULL,
  `status` varchar(32) DEFAULT NULL,
  `given_to` int DEFAULT NULL,
  `branch` int DEFAULT NULL,
  `audit_userid` int DEFAULT NULL,
  `audittimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blcsheet`
--


--
-- Table structure for table `branchmaster`
--

DROP TABLE IF EXISTS `branchmaster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branchmaster` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branchname` varchar(128) DEFAULT NULL,
  `active` char(1) DEFAULT NULL,
  `audituserid` int DEFAULT NULL,
  `audittimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branchmaster`
--

LOCK TABLES `branchmaster` WRITE;
/*!40000 ALTER TABLE `branchmaster` DISABLE KEYS */;
INSERT INTO `branchmaster` VALUES (1,'AHMEDABAD','Y',1,NULL),(2,'SIROHI','Y',1,'2021-12-18 18:44:39');
/*!40000 ALTER TABLE `branchmaster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designation`
--

DROP TABLE IF EXISTS `designation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `designation` varchar(64) DEFAULT NULL,
  `active` char(1) DEFAULT NULL,
  `audituserid` int DEFAULT NULL,
  `audittimestamp` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designation`
--

LOCK TABLES `designation` WRITE;
/*!40000 ALTER TABLE `designation` DISABLE KEYS */;
INSERT INTO `designation` VALUES (1,'Technician','Y',1,NULL),(2,'Weldar','Y',1,NULL),(3,'sales','Y',1,NULL);
/*!40000 ALTER TABLE `designation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_attendance`
--

DROP TABLE IF EXISTS `employee_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_attendance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `in_time` datetime DEFAULT NULL,
  `out_time` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `working_hours` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_date` (`employee_id`,`attendance_date`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_attendance`
--


--
-- Table structure for table `employee_leave`
--

DROP TABLE IF EXISTS `employee_leave`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_leave` (
  `leave_id` int NOT NULL AUTO_INCREMENT,
  `empMaintainerId` int NOT NULL,
  `leave_description` varchar(255) NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `status` enum('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approval_reason` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`leave_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_leave`
--


--
-- Table structure for table `employeeinfo`
--

DROP TABLE IF EXISTS `employeeinfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeeinfo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `firstName` varchar(64) DEFAULT NULL,
  `middleName` varchar(64) DEFAULT NULL,
  `lastName` varchar(64) DEFAULT NULL,
  `photo` varchar(256) DEFAULT NULL,
  `Address` varchar(512) DEFAULT NULL,
  `phoneno` varchar(16) DEFAULT NULL,
  `email` varchar(256) DEFAULT NULL,
  `city` varchar(64) DEFAULT NULL,
  `state` varchar(64) DEFAULT NULL,
  `designationId` int DEFAULT NULL,
  `dateOfJoining` date DEFAULT NULL,
  `empStatus` varchar(64) DEFAULT NULL,
  `empMainterId` int DEFAULT NULL,
  `Branch` int DEFAULT NULL,
  `createId` int DEFAULT NULL,
  `auditUserId` int DEFAULT NULL,
  `auditTimeStamp` timestamp NULL DEFAULT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `postalCode` int DEFAULT NULL,
  `qualification` varchar(45) DEFAULT NULL,
  `previousExperience` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employeeinfo`
--

LOCK TABLES `employeeinfo` WRITE;
/*!40000 ALTER TABLE `employeeinfo` DISABLE KEYS */;
INSERT INTO `employeeinfo` VALUES (1,'Prem','','Kumar','0','','7014877536','Nrs@Dream','sirohi','rajasthan',2,'2022-03-13','1',3,0,0,0,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `employeeinfo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employeemainter`
--

DROP TABLE IF EXISTS `employeemainter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employeemainter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mainterid` int DEFAULT NULL,
  `designationid` int DEFAULT NULL,
  `active` int DEFAULT NULL,
  `audituserid` int DEFAULT NULL,
  `audittimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employeemainter`
--

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `holiday_id` int NOT NULL AUTO_INCREMENT,
  `holiday_name` varchar(100) NOT NULL,
  `holiday_date` date NOT NULL,
  `year` int NOT NULL,
  `day_name` varchar(20) DEFAULT NULL,
  `holiday_type` varchar(50) DEFAULT NULL,
  `description` text,
  `is_optional` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`holiday_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` VALUES (1,'Republic Day','2026-01-26',2026,'Monday','National',NULL,0,'2026-01-31 15:30:23'),(2,'Holi','2026-03-04',2026,'Wednesday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(3,'Id-ul-Fitr','2026-03-21',2026,'Saturday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(4,'Ram Navami','2026-03-26',2026,'Thursday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(5,'Mahavir Jayanti','2026-03-31',2026,'Tuesday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(6,'Good Friday','2026-04-03',2026,'Friday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(7,'Buddha Purnima','2026-05-01',2026,'Friday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(8,'Id-ul-Zuha','2026-05-27',2026,'Wednesday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(9,'Muharram','2026-06-26',2026,'Friday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(10,'Independence Day','2026-08-15',2026,'Saturday','National',NULL,0,'2026-01-31 15:30:23'),(11,'Milad-un-Nabi','2026-08-26',2026,'Wednesday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(12,'Janmashtami','2026-09-04',2026,'Friday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(13,'Mahatma Gandhi\'s Birthday','2026-10-02',2026,'Friday','National',NULL,0,'2026-01-31 15:30:23'),(14,'Dussehra','2026-10-20',2026,'Tuesday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(15,'Diwali','2026-11-08',2026,'Sunday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(16,'Guru Nanak\'s Birthday','2026-11-24',2026,'Tuesday','Gazetted',NULL,0,'2026-01-31 15:30:23'),(17,'Christmas Day','2026-12-25',2026,'Friday','Gazetted',NULL,0,'2026-01-31 15:30:23');
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inquiry`
--

DROP TABLE IF EXISTS `inquiry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inquiry` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(150) DEFAULT NULL,
  `contact_no` varchar(20) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `given_by_id` bigint DEFAULT NULL,
  `given_by_name` varchar(150) DEFAULT NULL,
  `inquiry_history` text,
  `inquiry_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inquiry`
--


--
-- Table structure for table `post_activity`
--

DROP TABLE IF EXISTS `post_activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_activity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `emp_id` bigint NOT NULL,
  `post_text` text,
  `post_image` varchar(255) DEFAULT NULL,
  `audit_time_stamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `emp_id` (`emp_id`),
  CONSTRAINT `post_activity_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employeeinfo` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_activity`
--


--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `priority` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_id` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'SUPERADMIN','Administrator role with full access to the system',1),(2,'ADMIN','Moderator role with limited access to manage content',2),(3,'MANAGER','Manager site with basic access',3),(4,'USER','user role with regular access',5),(5,'TECHNICIAN','Its for site engineer',4);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statustype`
--

DROP TABLE IF EXISTS `statustype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statustype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` varchar(64) DEFAULT NULL,
  `statustype` varchar(8) DEFAULT NULL,
  `active` char(1) DEFAULT NULL,
  `audituserid` int DEFAULT NULL,
  `audittimestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `statustype`
--

LOCK TABLES `statustype` WRITE;
/*!40000 ALTER TABLE `statustype` DISABLE KEYS */;
INSERT INTO `statustype` VALUES (1,'Under Review','Emp','Y',1,NULL),(2,'Confirmed','Emp','Y',1,NULL);
/*!40000 ALTER TABLE `statustype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_login`
--

DROP TABLE IF EXISTS `user_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_login` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `custom_id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_login`
--

LOCK TABLES `user_login` WRITE;
/*!40000 ALTER TABLE `user_login` DISABLE KEYS */;
INSERT INTO `user_login` VALUES (101,'1','Nrs@Dream','$2a$10$S9ZH5QI0oko.V/ttUzDNI.Ri/2oEPCKXsQ4z4YhcHypz7ATuv8hny','2024-10-19 12:07:30');
/*!40000 ALTER TABLE `user_login` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `user_login` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (101,1);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


CREATE TABLE `expenses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `description` varchar(255) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `advanced_amount` decimal(10,2) DEFAULT NULL,
  `expense_date` date DEFAULT NULL,
  `given_by` varchar(100) DEFAULT NULL,
  `given_to` varchar(100) DEFAULT NULL,
  `expense_type` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

CREATE TABLE document_sequence (
    doc_type VARCHAR(50),
    financial_year VARCHAR(10),
    last_number INT,
    PRIMARY KEY (doc_type, financial_year)
);
-- Dump completed on 2026-03-07 15:13:56

