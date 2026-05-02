package com.seacredit.backend.module.customer;

import com.seacredit.backend.common.enums.CurrencyCode;
import com.seacredit.backend.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "fin_code", nullable = false, unique = true, length = 7)
    private String finCode;

    @Column(name = "id_serial", nullable = false, length = 20)
    private String idSerial;

    @Column(name = "id_issued_by")
    private String idIssuedBy;

    @Column(name = "id_issued_date")
    private LocalDate idIssuedDate;

    @Column(name = "id_expiry_date")
    private LocalDate idExpiryDate;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(length = 1)
    private String gender;

    @Column(nullable = false, length = 20)
    private String mobile;

    @Column(name = "mobile_alt", length = 20)
    private String mobileAlt;

    @Column
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false)
    private EmploymentStatus employmentStatus;

    @Column(name = "employer_name")
    private String employerName;

    @Column(name = "monthly_income", precision = 18, scale = 2)
    private BigDecimal monthlyIncome;

    @Enumerated(EnumType.STRING)
    @Column(name = "income_currency", nullable = false)
    @Builder.Default
    private CurrencyCode incomeCurrency = CurrencyCode.AZN;

    @Column(name = "is_blacklisted", nullable = false)
    @Builder.Default
    private boolean blacklisted = false;

    @Column(name = "blacklist_reason", columnDefinition = "TEXT")
    private String blacklistReason;

    @Column(name = "credit_score")
    private Integer creditScore;

    @Column(name = "bureau_checked_at")
    private LocalDateTime bureauCheckedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Customer portal login link

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
