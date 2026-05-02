package com.seacredit.backend.module.customer.dto;

import com.seacredit.backend.common.enums.CurrencyCode;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CustomerDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String middleName;
    private String finCode;
    private String idSerial;
    private LocalDate birthDate;
    private String mobile;
    private String email;
    private String address;
    private String city;
    private String employmentStatus;
    private String employerName;
    private BigDecimal monthlyIncome;
    private CurrencyCode incomeCurrency;
    private boolean blacklisted;
    private Integer creditScore;
    private LocalDateTime bureauCheckedAt;
    private LocalDateTime createdAt;
}
