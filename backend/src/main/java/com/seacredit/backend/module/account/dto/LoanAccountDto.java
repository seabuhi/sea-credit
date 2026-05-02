package com.seacredit.backend.module.account.dto;

import com.seacredit.backend.common.enums.CurrencyCode;
import com.seacredit.backend.common.enums.LoanAccountStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class LoanAccountDto {
    private Long id;
    private String accountNo;
    private String contractNo;
    private Long applicationId;
    private Long customerId;
    private String customerFullName;
    private String customerFin;
    private String loanProductName;
    private BigDecimal principalAmount;
    private BigDecimal principalAmountAzn;
    private BigDecimal interestRate;
    private Integer termMonths;
    private CurrencyCode currency;
    
    // Aligned with frontend expected names
    private BigDecimal balancePrincipal;
    private BigDecimal balanceInterest;
    private BigDecimal balancePenalty;
    
    private LoanAccountStatus status;
    private LocalDate startDate;
    private LocalDate disbursementDate; // startDate is often used as disbursement date
    private LocalDate maturityDate;
    private LocalDate nextPaymentDate;
    
    private java.time.LocalDateTime disbursedAt;
    private List<RepaymentScheduleDto> repaymentSchedules;
}
