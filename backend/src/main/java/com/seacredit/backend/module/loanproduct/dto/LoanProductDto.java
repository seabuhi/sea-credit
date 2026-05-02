package com.seacredit.backend.module.loanproduct.dto;

import com.seacredit.backend.common.enums.InterestType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanProductDto {
    private Long id;
    private String name;
    private String code;
    private String description;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private Integer minTermMonths;
    private Integer maxTermMonths;
    private InterestType interestType;
    private BigDecimal baseInterestRate;
    private BigDecimal originationFeeRate;
    private BigDecimal maxDti;
    private boolean collateralRequired;
    private Integer minAge;
    private Integer maxAge;
    private BigDecimal minIncome;
    private com.seacredit.backend.common.enums.CurrencyCode currency;
    private boolean active;
}
