package com.seacredit.backend.module.application;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.common.enums.CurrencyCode;
import com.seacredit.backend.module.customer.Customer;
import com.seacredit.backend.module.loanproduct.LoanProduct;
import com.seacredit.backend.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "loan_applications")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_no", nullable = false, unique = true, length = 20)
    private String applicationNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_product_id", nullable = false)
    private LoanProduct loanProduct;

    @Column(name = "requested_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "requested_term", nullable = false)
    private Integer requestedTerm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private CurrencyCode currency = CurrencyCode.AZN;

    @Column(name = "requested_amount_azn", precision = 18, scale = 2)
    private BigDecimal requestedAmountAzn;

    @Column(name = "exchange_rate_used", precision = 18, scale = 6)
    private BigDecimal exchangeRateUsed;

    @Column(columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "has_collateral", nullable = false)
    private boolean hasCollateral;

    @Column(name = "collateral_type", length = 100)
    private String collateralType;

    @Column(name = "collateral_description", columnDefinition = "TEXT")
    private String collateralDescription;

    @Column(name = "collateral_estimated_value", precision = 18, scale = 2)
    private BigDecimal collateralEstimatedValue;

    @Column(name = "has_guarantor", nullable = false)
    private boolean hasGuarantor;

    @Column(name = "guarantor_name")
    private String guarantorName;

    @Column(name = "guarantor_fin", length = 7)
    private String guarantorFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.DRAFT;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(name = "precheck_passed")
    private Boolean precheckPassed;

    @Column(name = "precheck_notes", columnDefinition = "TEXT")
    private String precheckNotes;

    @Column(name = "precheck_at")
    private LocalDateTime precheckAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ApplicationDocument> documents = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Version
    private Integer version;

    public void addDocument(ApplicationDocument document) {
        documents.add(document);
        document.setApplication(this);
    }
}
