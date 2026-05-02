package com.seacredit.backend.module.application.dto;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.common.enums.CurrencyCode;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class LoanApplicationDto {
    private Long id;
    private String applicationNo;
    private Long customerId;
    private String customerFullName;
    private String customerFin;
    private Long loanProductId;
    private String loanProductName;
    private BigDecimal requestedAmount;
    private Integer requestedTerm;
    private CurrencyCode currency;
    private BigDecimal requestedAmountAzn;
    private ApplicationStatus status;
    private LocalDateTime createdAt;
    private List<ApplicationDocumentDto> documents;
}
