package com.seacredit.backend.module.customer.dto;

import com.seacredit.backend.common.enums.CurrencyCode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CustomerCreateRequest {
    @NotBlank(message = "Ad boş ola bilməz")
    private String firstName;

    @NotBlank(message = "Soyad boş ola bilməz")
    private String lastName;

    private String middleName;

    @NotBlank(message = "FİN kod boş ola bilməz")
    @Size(min = 7, max = 7, message = "FİN kod 7 simvol olmalıdır")
    private String finCode;

    @NotBlank(message = "Şəxsiyyət vəsiqəsinin seriyası boş ola bilməz")
    private String idSerial;

    @NotNull(message = "Doğum tarixi boş ola bilməz")
    @Past(message = "Doğum tarixi keçmiş zaman olmalıdır")
    private LocalDate birthDate;

    @NotBlank(message = "Mobil nömrə boş ola bilməz")
    private String mobile;

    private String email;
    private String address;
    private String city;

    @NotBlank(message = "Məşğulluq növü seçilməlidir")
    private String employmentStatus;

    private String employerName;
    private BigDecimal monthlyIncome;
    private CurrencyCode incomeCurrency;
}
