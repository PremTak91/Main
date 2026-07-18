package com.web.nrs.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissingTimesheetDTO {
    private Long employeeId;
    private String employeeName;
    private LocalDate missingDate;
    private String designation;
    private String status; // "Missing"
}
