package com.web.nrs.scheduler;

import com.web.nrs.entity.EmployeeEntity;
import com.web.nrs.repository.EmployeeRepository;
import com.web.nrs.service.PostActivityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class BirthdayAnnouncementScheduler {

    private final EmployeeRepository employeeRepository;
    private final PostActivityService postActivityService;

    // Run every day at 9:00 AM
    @Scheduled(cron = "0 0 9 * * ?")
    public void announceBirthdays() {
        log.info("Checking for today's birthdays to announce...");
        try {
            List<EmployeeEntity> allEmployees = employeeRepository.findAll();
            LocalDate today = LocalDate.now();
            int targetMonth = today.getMonthValue();
            int targetDay = today.getDayOfMonth();

            List<EmployeeEntity> birthdayEmployees = allEmployees.stream()
                    .filter(e -> e.getDateOfBirth() != null && !e.getDateOfBirth().toString().trim().isEmpty())
                    .filter(e -> {
                        try {
                            String dobStr = e.getDateOfBirth().toString().trim();
                            LocalDate dob = parseDate(dobStr);
                            if (dob == null) {
                                return false;
                            }
                            return dob.getMonthValue() == targetMonth && dob.getDayOfMonth() == targetDay;
                        } catch (Exception ex) {
                            return false;
                        }
                    })
                    .filter(e -> e.getEmpStatus() == null || e.getEmpStatus() == 1 || "1".equals(String.valueOf(e.getEmpStatus())))
                    .collect(Collectors.toList());

            if (birthdayEmployees.isEmpty()) {
                log.info("No employee birthdays today.");
                return;
            }

            String message;
            if (birthdayEmployees.size() == 1) {
                EmployeeEntity emp = birthdayEmployees.get(0);
                String fullName = emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : "");
                fullName = fullName.trim();
                message = "🎉 Happy Birthday, " + fullName + "!\n\n" +
                          "Wishing you a fantastic birthday filled with happiness, success, and good health. " +
                          "May this year bring new opportunities and wonderful achievements.\n\n" +
                          "Have a great day and enjoy your special occasion! 🎂🎈";
            } else {
                StringBuilder builder = new StringBuilder();
                builder.append("🎉 Birthday Wishes for Today! 🎉\n\n");
                builder.append("Please join us in wishing a very Happy Birthday to:\n\n");
                for (EmployeeEntity emp : birthdayEmployees) {
                    String fullName = emp.getFirstName() + " " + (emp.getLastName() != null ? emp.getLastName() : "");
                    fullName = fullName.trim();
                    builder.append("🎂 ").append(fullName).append("\n");
                }
                builder.append("\nMay your day be filled with happiness, success, and memorable moments. " +
                               "Wishing you all a wonderful year ahead!\n\n");
                builder.append("Happy Birthday and enjoy your special day! 🎈🎁");
                message = builder.toString();
            }

            // Save the post under HR/admin (prefer ID 1 if exists, fallback to ID 3 or first employee)
            Long authorId = 1L;
            if (!employeeRepository.existsById(authorId)) {
                if (employeeRepository.existsById(3L)) {
                    authorId = 3L;
                } else {
                    authorId = employeeRepository.findAll().stream()
                            .map(EmployeeEntity::getId)
                            .findFirst()
                            .orElse(1L);
                }
            }
            postActivityService.savePost(authorId, message, null);
            log.info("Posted birthday announcement successfully: {}", message.replace("\n", " "));

        } catch (Exception e) {
            log.error("Error creating birthday announcement post", e);
        }
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        // Try yyyy-MM-dd (standard ISO format)
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            // ignore
        }
        // Try dd/MM/yyyy
        try {
            return LocalDate.parse(dateStr, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception e) {
            // ignore
        }
        // Try dd-MM-yyyy
        try {
            return LocalDate.parse(dateStr, java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
        } catch (Exception e) {
            // ignore
        }
        // Try yyyy/MM/dd
        try {
            return LocalDate.parse(dateStr, java.time.format.DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        } catch (Exception e) {
            // ignore
        }
        return null;
    }
}

