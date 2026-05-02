package com.seacredit.backend.module.assessment;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_decisions")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false)
    private Decision decision;

    @Column(columnDefinition = "TEXT")
    private String decisionNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decision_by", nullable = false)
    private User decisionBy;

    @CreationTimestamp
    @Column(name = "decision_at", updatable = false)
    private LocalDateTime decisionAt;
}

enum Decision {
    APPROVE, REJECT, REQUEST_INFO, CANCEL
}
