package com.seacredit.backend.module.account.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RepaymentScheduleDto {
    private Long id;
    private Integer installmentNo;
    private LocalDate dueDate;
    private BigDecimal openingBalance;
    
    // Aligned with frontend expected names
    private BigDecimal principalAmount; // was principalDue
    private BigDecimal interestAmount;  // was interestDue
    private BigDecimal totalAmount;     // was totalDue
    private BigDecimal paidAmount;      // was paidTotal
    
    private com.seacredit.backend.common.enums.ScheduleStatus status;
    private int overdueDays;
    private java.time.LocalDateTime paidAt;
}
