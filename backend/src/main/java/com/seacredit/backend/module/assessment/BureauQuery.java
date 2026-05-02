package com.seacredit.backend.module.assessment;

import com.seacredit.backend.common.enums.BureauStatus;
import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.customer.Customer;
import com.seacredit.backend.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "bureau_queries")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BureauQuery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "fin_code", nullable = false, length = 7)
    private String finCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private BureauStatus status = BureauStatus.RECEIVED;

    @Column(name = "query_date", nullable = false)
    @CreationTimestamp
    private LocalDateTime queryDate;

    @Column(name = "bureau_name", nullable = false)
    @Builder.Default
    private String bureauName = "AKB";

    @Column(name = "external_reference")
    private String externalReference;

    @Column(columnDefinition = "TEXT")
    private String responseJson;

    @Column(name = "score")
    private Integer score;

    @Column(name = "has_active_loans")
    private boolean hasActiveLoans;

    @Column(name = "total_debt_azn")
    private java.math.BigDecimal totalDebtAzn;

    @Column(name = "monthly_payment_azn")
    private java.math.BigDecimal monthlyPaymentAzn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "queried_by", nullable = false)
    private User queriedBy;
}
