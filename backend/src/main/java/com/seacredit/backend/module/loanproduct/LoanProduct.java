package com.seacredit.backend.module.loanproduct;

import com.seacredit.backend.common.enums.InterestType;
import com.seacredit.backend.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_products")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "min_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal minAmount;

    @Column(name = "max_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal maxAmount;

    @Column(name = "min_term_months", nullable = false)
    private Integer minTermMonths;

    @Column(name = "max_term_months", nullable = false)
    private Integer maxTermMonths;

    @Enumerated(EnumType.STRING)
    @Column(name = "interest_type", nullable = false)
    @Builder.Default
    private InterestType interestType = InterestType.ANNUITET;

    @Column(name = "base_interest_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal baseInterestRate;

    @Column(name = "origination_fee_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal originationFeeRate;

    @Column(name = "max_dti", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxDti;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    @Builder.Default
    private com.seacredit.backend.common.enums.CurrencyCode currency = com.seacredit.backend.common.enums.CurrencyCode.AZN;

    @Column(name = "collateral_required", nullable = false)
    private boolean collateralRequired;

    @Column(name = "min_age", nullable = false)
    private Integer minAge;

    @Column(name = "max_age", nullable = false)
    private Integer maxAge;

    @Column(name = "min_income", precision = 18, scale = 2)
    private BigDecimal minIncome;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
