package com.seacredit.backend.module.assessment;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.application.LoanApplicationRepository;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalDecisionRepository approvalDecisionRepository;
    private final LoanApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CreditAssessmentRepository assessmentRepository;

    @Transactional
    public ApprovalDecision decide(Long applicationId, Decision decision, String notes) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", applicationId));

        // Validation: Cannot decide on DRAFT or finished applications
        if (application.getStatus() == ApplicationStatus.DRAFT || 
            application.getStatus() == ApplicationStatus.CANCELLED ||
            application.getStatus() == ApplicationStatus.REJECTED ||
            application.getStatus() == ApplicationStatus.ACTIVE) {
            throw new BusinessException("Müraciət cari statusunda (" + application.getStatus() + ") qərar qəbul edilə bilməz.");
        }

        // Must have an assessment before approval
        if (!assessmentRepository.findByApplicationId(applicationId).isPresent()) {
            throw new BusinessException("Qərar qəbul etməzdən əvvəl analiz (assessment) tamamlanmalıdır.");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();

        // Update application status based on decision
        ApplicationStatus newStatus;
        switch (decision) {
            case APPROVE: newStatus = ApplicationStatus.APPROVED; break;
            case REJECT: newStatus = ApplicationStatus.REJECTED; break;
            case REQUEST_INFO: newStatus = ApplicationStatus.UNDER_REVIEW; break;
            case CANCEL: newStatus = ApplicationStatus.CANCELLED; break;
            default: throw new BusinessException("Yanlış qərar növü");
        }

        application.setStatus(newStatus);
        applicationRepository.save(application);

        ApprovalDecision approvalDecision = ApprovalDecision.builder()
                .application(application)
                .decision(decision)
                .decisionNotes(notes)
                .decisionBy(currentUser)
                .build();

        return approvalDecisionRepository.save(approvalDecision);
    }
}
