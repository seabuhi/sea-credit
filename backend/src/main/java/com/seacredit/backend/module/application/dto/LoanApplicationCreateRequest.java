package com.seacredit.backend.module.application.dto;

import com.seacredit.backend.common.enums.CurrencyCode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LoanApplicationCreateRequest {
    private Long customerId;

    @NotNull(message = "Kredit məhsulu ID-si boş ola bilməz")
    private Long loanProductId;

    @NotNull(message = "Məbləğ boş ola bilməz")
    @DecimalMin(value = "0.01", message = "Məbləğ 0-dan böyük olmalıdır")
    private BigDecimal requestedAmount;

    @NotNull(message = "Müddət boş ola bilməz")
    @Min(value = 1, message = "Müddət ən azı 1 ay olmalıdır")
    private Integer requestedTerm;

    @NotNull(message = "Valyuta boş ola bilməz")
    private CurrencyCode currency;

    private String purpose;

    private boolean hasCollateral;
    private String collateralType;
    private String collateralDescription;
    private BigDecimal collateralEstimatedValue;

    private boolean hasGuarantor;
    private String guarantorName;
    private String guarantorFin;

    private BigDecimal monthlyIncome;
    private String employmentStatus;
}
