package com.seacredit.backend.module.currency;

import com.seacredit.backend.common.enums.CurrencyCode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_rates")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CurrencyCode currency;

    @Column(name = "rate_to_azn", nullable = false, precision = 18, scale = 6)
    private BigDecimal rateToAzn;

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(nullable = false)
    @Builder.Default
    private String source = "CBAR";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
