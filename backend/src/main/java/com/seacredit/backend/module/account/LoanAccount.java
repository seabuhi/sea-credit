package com.seacredit.backend.module.account;

import com.seacredit.backend.common.enums.CurrencyCode;
import com.seacredit.backend.common.enums.LoanAccountStatus;
import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.customer.Customer;
import com.seacredit.backend.module.loanproduct.LoanProduct;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "loan_accounts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "account_no", nullable = false, unique = true, length = 30)
    private String accountNo;

    @Column(name = "contract_no", nullable = false, unique = true, length = 30)
    private String contractNo;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_product_id", nullable = false)
    private LoanProduct loanProduct;

    @Column(name = "principal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalAmount;

    @Column(name = "principal_amount_azn", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalAmountAzn;

    @Column(name = "currency", nullable = false)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private CurrencyCode currency;

    @Column(name = "exchange_rate", precision = 18, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "interest_rate", nullable = false, precision = 6, scale = 4)
    private BigDecimal interestRate;

    @Column(name = "interest_type", nullable = false)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private com.seacredit.backend.common.enums.InterestType interestType = com.seacredit.backend.common.enums.InterestType.ANNUITET;

    @Column(name = "term_months", nullable = false)
    private Integer termMonths;

    @Column(name = "origination_fee", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal originationFee = BigDecimal.ZERO;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "maturity_date")
    private LocalDate maturityDate;

    @Column(name = "disbursed_at")
    private LocalDateTime disbursedAt;

    @Column(name = "outstanding_principal", nullable = false, precision = 18, scale = 2)
    private BigDecimal outstandingPrincipal;

    @Column(name = "accrued_interest", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal accruedInterest = BigDecimal.ZERO;

    @Column(name = "accrued_penalty", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal accruedPenalty = BigDecimal.ZERO;

    @Column(name = "total_paid_principal", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPaidPrincipal = BigDecimal.ZERO;

    @Column(name = "total_paid_interest", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPaidInterest = BigDecimal.ZERO;

    @Column(name = "total_paid_penalty", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalPaidPenalty = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private LoanAccountStatus status = LoanAccountStatus.ACTIVE;

    @Column(name = "overdue_days", nullable = false)
    @Builder.Default
    private int overdueDays = 0;

    @Column(name = "is_npl", nullable = false)
    @Builder.Default
    private boolean npl = false;

    @Column(name = "is_restructured", nullable = false)
    @Builder.Default
    private boolean restructured = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private com.seacredit.backend.module.user.User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private int version;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "loanAccount", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RepaymentSchedule> repaymentSchedules = new ArrayList<>();

    public void addInstallment(RepaymentSchedule installment) {
        repaymentSchedules.add(installment);
        installment.setLoanAccount(this);
    }
}
