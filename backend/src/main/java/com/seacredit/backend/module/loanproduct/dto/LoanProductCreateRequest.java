package com.seacredit.backend.module.loanproduct.dto;

import com.seacredit.backend.common.enums.CurrencyCode;
import com.seacredit.backend.common.enums.InterestType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanProductCreateRequest {
    @NotBlank(message = "Məhsul adı boş ola bilməz")
    private String name;

    @NotBlank(message = "Məhsul kodu boş ola bilməz")
    private String code;

    private String description;

    @NotNull(message = "Minimum məbləğ boş ola bilməz")
    @DecimalMin(value = "0.01")
    private BigDecimal minAmount;

    @NotNull(message = "Maksimum məbləğ boş ola bilməz")
    @DecimalMin(value = "0.01")
    private BigDecimal maxAmount;

    @NotNull(message = "Minimum müddət boş ola bilməz")
    private Integer minTermMonths;

    @NotNull(message = "Maksimum müddət boş ola bilməz")
    private Integer maxTermMonths;

    @NotNull(message = "Faiz tipi boş ola bilməz")
    private InterestType interestType;

    @NotNull(message = "Faiz dərəcəsi boş ola bilməz")
    private BigDecimal baseInterestRate;

    @NotNull(message = "Xidmət haqqı boş ola bilməz")
    private BigDecimal originationFeeRate;

    @NotNull(message = "Maksimum DTI boş ola bilməz")
    private BigDecimal maxDti;

    @NotNull(message = "Valyuta boş ola bilməz")
    private CurrencyCode currency;

    private boolean collateralRequired;

    @NotNull(message = "Minimum yaş boş ola bilməz")
    private Integer minAge;

    @NotNull(message = "Maksimum yaş boş ola bilməz")
    private Integer maxAge;

    private BigDecimal minIncome;
}
