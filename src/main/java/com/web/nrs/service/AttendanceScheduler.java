package com.web.nrs.service;

import com.web.nrs.entity.EmployeeAttendanceEntity;
import com.web.nrs.repository.EmployeeAttendanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {

    private final EmployeeAttendanceRepository employeeAttendanceRepository;

    // Run every day at 12:00 AM IST (Midnight India Time)
    // The JVM is forced to Asia/Kolkata timezone at startup (see NrsprojectApplication.java)
    // so this cron fires at IST midnight correctly on all environments (local + Docker/server)
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Kolkata")
    public void autoPunchOut() {
        log.info("Running autoPunchOut scheduler at IST midnight");

        // Get current date in IST
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));

        // Find all open sessions (no out-time recorded)
        List<EmployeeAttendanceEntity> forgottenEntries = employeeAttendanceRepository.findByOutTimeIsNull();

        for (EmployeeAttendanceEntity entry : forgottenEntries) {
            // Only close sessions from a previous day (not sessions that just started at midnight edge)
            if (entry.getInTime().toLocalDate().isBefore(today)) {
                LocalDateTime autoOutTime = entry.getInTime().plusHours(8); // Fixed 8-hour working day
                entry.setOutTime(autoOutTime);
                entry.setWorkingHours("08:00");
                entry.setStatus("PRESENT");

                employeeAttendanceRepository.save(entry);
                log.info("Auto-punched out employee {} for entry {}", entry.getEmployeeId(), entry.getId());
            }
        }
    }
}
