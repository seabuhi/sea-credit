package com.seacredit.backend.module.assessment;

import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_assessments")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;

    @Column(name = "monthly_income_azn", nullable = false, precision = 18, scale = 2)
    private BigDecimal customerMonthlyIncome;

    @Column(name = "monthly_expense_azn", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal monthlyExpenseAzn = BigDecimal.ZERO;

    @Column(name = "existing_loan_payment", nullable = false, precision = 18, scale = 2)
    private BigDecimal existingMonthlyPayments;

    @Column(name = "proposed_payment", precision = 18, scale = 2)
    private BigDecimal newLoanMonthlyPayment;

    @Column(name = "dti_ratio", precision = 6, scale = 2)
    private BigDecimal calculatedDti; // Debt-to-Income ratio

    @Column(name = "bureau_score")
    private Integer creditScore;

    @Column(name = "internal_rating", length = 10)
    private String internalRating;

    @Column(name = "recommendation", nullable = false)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private com.seacredit.backend.common.enums.RecommendationType recommendation;

    @Column(name = "is_recommended", nullable = false)
    private boolean recommended;

    @Column(columnDefinition = "TEXT")
    private String assessmentNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessed_by", nullable = false)
    private User assessedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime assessedAt;
}
