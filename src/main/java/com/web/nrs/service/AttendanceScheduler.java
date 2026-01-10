package com.web.nrs.service;

import com.web.nrs.entity.EmployeeAttendanceEntity;
import com.web.nrs.repository.EmployeeAttendanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {

    private final EmployeeAttendanceRepository employeeAttendanceRepository;

    // Run every hour to check for forgotten punch-outs
    // Run every day at 12 AM (Midnight)
    @Scheduled(cron = "0 0 0 * * *")
    public void autoPunchOut() {
        log.info("Running autoPunchOut scheduler");
        // Find entries where outTime is null and inTime is before today (meaning they forgot to punch out yesterday)
        // Actually, since it runs at 00:00, we check for any open session from "before now" or specifically "yesterday"?
        // Simpler: Find any null outTime. The user request says "if user not logout then after 12 am run the job".
        // Use LocalDateTime.now() as the cutoff isn't strictly necessary if checking *all* nulls, 
        // but to be safe and avoid closing a session started 1 minute ago (if that's possible at 12am), 
        // we can check for inTime before e.g. 20 hours ago? Or just any open session from the *previous day*.
        // The original code used 12 hours ago. Let's stick to "forgotten" implies started on a previous day.
        
        LocalDateTime yesterdayEnd = LocalDateTime.now().minusHours(4); // Safe buffer, anything started before 8 PM yesterday?
        // Or just "All null outTime".
        // Let's stick to the previous logic structure but simplified: findByOutTimeIsNull().
        // But better to filter by date to avoid edge cases.
        // Let's assume anyone still logged in at Midnight (start of new day) forgot to log out or is working late.
        // User rule: "after 12 am run the job and mark logout and calculate 8 hours".
        // So we close ALL open sessions.
        
        List<EmployeeAttendanceEntity> forgottenEntries = employeeAttendanceRepository.findByOutTimeIsNull();

        for (EmployeeAttendanceEntity entry : forgottenEntries) {
            // Check if it's actually from a previous day to avoid weird edge cases if the job runs slightly off
            if(entry.getInTime().toLocalDate().isBefore(java.time.LocalDate.now())) {
                 LocalDateTime autoOutTime = entry.getInTime().plusHours(8); // Fixed 8 hours
                 entry.setOutTime(autoOutTime);
                 entry.setWorkingHours("08:00");
                 entry.setStatus("PRESENT");
                 
                 employeeAttendanceRepository.save(entry);
                 log.info("Auto-punched out employee {} for entry {}", entry.getEmployeeId(), entry.getId());
            }
        }
    }
}
