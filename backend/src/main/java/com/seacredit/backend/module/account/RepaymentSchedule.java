package com.seacredit.backend.module.account;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "repayment_schedules")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepaymentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_account_id", nullable = false)
    private LoanAccount loanAccount;

    @Column(name = "installment_no", nullable = false)
    private Integer installmentNo;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "opening_balance", precision = 18, scale = 2)
    private BigDecimal openingBalance;

    @Column(name = "principal_due", nullable = false, precision = 18, scale = 2)
    private BigDecimal principalDue;

    @Column(name = "interest_due", nullable = false, precision = 18, scale = 2)
    private BigDecimal interestDue;

    @Column(name = "total_due", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalDue;

    @Column(name = "paid_principal", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidPrincipal = BigDecimal.ZERO;

    @Column(name = "paid_interest", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidInterest = BigDecimal.ZERO;

    @Column(name = "paid_penalty", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidPenalty = BigDecimal.ZERO;

    @Column(name = "paid_total", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidTotal = BigDecimal.ZERO;

    @Column(name = "penalty_due", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal penaltyDue = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    @Builder.Default
    private com.seacredit.backend.common.enums.ScheduleStatus status = com.seacredit.backend.common.enums.ScheduleStatus.PENDING;

    @Column(name = "overdue_days", nullable = false)
    @Builder.Default
    private int overdueDays = 0;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
