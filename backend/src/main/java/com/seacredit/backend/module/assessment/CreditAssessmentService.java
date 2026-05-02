package com.seacredit.backend.module.assessment;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.common.enums.RecommendationType;
import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.application.LoanApplicationRepository;
import com.seacredit.backend.module.application.StatusHistory;
import com.seacredit.backend.module.application.StatusHistoryRepository;
import com.seacredit.backend.module.assessment.dto.AssessmentResponse;
import com.seacredit.backend.module.customer.Customer;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreditAssessmentService {

    private final CreditAssessmentRepository assessmentRepository;
    private final LoanApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final CreditBureauService bureauService;
    private final StatusHistoryRepository statusHistoryRepository;

    @Transactional
    public AssessmentResponse performAssessment(Long applicationId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", applicationId));

        if (application.getStatus() != ApplicationStatus.PRECHECK_PASSED && 
            application.getStatus() != ApplicationStatus.UNDER_REVIEW) {
            throw new BusinessException("Müraciət bu mərhələdə analiz edilə bilməz.");
        }

        // 1. Fetch data from Credit Bureau (simulated)
        BureauQuery bureauData = bureauService.queryBureau(application);
        
        // 2. Calculate New Monthly Payment
        BigDecimal monthlyRate = application.getLoanProduct().getBaseInterestRate()
                .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);
        int months = application.getRequestedTerm();
        BigDecimal amount = application.getRequestedAmountAzn() != null ? application.getRequestedAmountAzn() : application.getRequestedAmount();
        
        BigDecimal pmt;
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            pmt = amount.divide(BigDecimal.valueOf(months), 2, RoundingMode.HALF_UP);
        } else {
            BigDecimal factor = monthlyRate.add(BigDecimal.ONE).pow(months);
            BigDecimal denominator = factor.subtract(BigDecimal.ONE);
            pmt = amount.multiply(monthlyRate).multiply(factor).divide(denominator, 2, RoundingMode.HALF_UP);
        }

        // 3. Calculate DTI
        Customer customer = application.getCustomer();
        BigDecimal income = customer.getMonthlyIncome() != null && customer.getMonthlyIncome().compareTo(BigDecimal.ZERO) > 0 
                ? customer.getMonthlyIncome() : BigDecimal.ONE;
        BigDecimal totalPayments = bureauData.getMonthlyPaymentAzn().add(pmt);
        BigDecimal dti = totalPayments.divide(income, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        // 4. Determine recommendation
        boolean recommended = dti.compareTo(application.getLoanProduct().getMaxDti()) <= 0 && 
                               bureauData.getScore() > 400;

        String internalRating = determineRating(bureauData.getScore(), dti);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();

        CreditAssessment assessment = assessmentRepository.findByApplicationId(applicationId)
                .orElse(new CreditAssessment());
        
        assessment.setApplication(application);
        assessment.setCustomerMonthlyIncome(income);
        assessment.setExistingMonthlyPayments(bureauData.getMonthlyPaymentAzn());
        assessment.setNewLoanMonthlyPayment(pmt);
        assessment.setCalculatedDti(dti);
        assessment.setCreditScore(bureauData.getScore());
        assessment.setInternalRating(internalRating);
        assessment.setRecommended(recommended);
        assessment.setRecommendation(recommended ? RecommendationType.APPROVE : RecommendationType.REJECT);
        assessment.setAssessmentNotes(recommended ? "Məqbuldur." : "DTI çox yüksəkdir və ya score aşağıdır.");
        assessment.setAssessedBy(currentUser);

        CreditAssessment saved = assessmentRepository.save(assessment);

        // Update application status
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.UNDER_REVIEW);
        applicationRepository.save(application);

        // Record History
        statusHistoryRepository.save(StatusHistory.builder()
                .application(application)
                .oldStatus(oldStatus)
                .newStatus(ApplicationStatus.UNDER_REVIEW)
                .notes("Kredit analizi tamamlandı. Reytinq: " + internalRating)
                .changedBy(currentUser)
                .build());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Optional<AssessmentResponse> getAssessmentByApplication(Long applicationId) {
        return assessmentRepository.findByApplicationId(applicationId).map(this::toResponse);
    }

    private AssessmentResponse toResponse(CreditAssessment entity) {
        return AssessmentResponse.builder()
                .id(entity.getId())
                .creditScore(entity.getCreditScore())
                .dti(entity.getCalculatedDti())
                .recommendation(entity.isRecommended() ? "POSITIVE" : "NEGATIVE")
                .notes(entity.getAssessmentNotes())
                .assessedAt(entity.getAssessedAt())
                .build();
    }

    private String determineRating(int score, BigDecimal dti) {
        if (score > 800 && dti.compareTo(BigDecimal.valueOf(30)) < 0) return "AAA";
        if (score > 700 && dti.compareTo(BigDecimal.valueOf(40)) < 0) return "AA";
        if (score > 600 && dti.compareTo(BigDecimal.valueOf(50)) < 0) return "A";
        if (score > 500) return "B";
        return "C";
    }
}
