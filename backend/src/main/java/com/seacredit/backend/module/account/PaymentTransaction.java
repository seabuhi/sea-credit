package com.seacredit.backend.module.account;

import com.seacredit.backend.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_account_id", nullable = false)
    private LoanAccount loanAccount;

    @Column(name = "transaction_no", nullable = false, unique = true, length = 20)
    private String transactionNo;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "principal_part", precision = 18, scale = 2)
    private BigDecimal principalPart;

    @Column(name = "interest_part", precision = 18, scale = 2)
    private BigDecimal interestPart;

    @Column(name = "penalty_part", precision = 18, scale = 2)
    private BigDecimal penaltyPart;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "transaction_date")
    @CreationTimestamp
    private LocalDateTime transactionDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by", nullable = false)
    private User receivedBy;
}

enum PaymentMethod {
    CASH, BANK_TRANSFER, TERMINAL, CARD, ONLINE, INTERNAL_TRANSFER
}
