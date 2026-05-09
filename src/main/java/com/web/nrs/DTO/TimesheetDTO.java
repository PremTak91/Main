package com.web.nrs.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimesheetDTO {
    private Long id;
    private String employeeName;
    private LocalDateTime inTime;
    private LocalDateTime outTime;
    private String workingHours;
    private String status;
    private LocalDate attendanceDate;
}
