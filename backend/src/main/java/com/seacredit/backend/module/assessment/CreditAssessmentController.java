package com.seacredit.backend.module.assessment;

import com.seacredit.backend.common.response.ApiResponse;
import com.seacredit.backend.module.assessment.dto.AssessmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/assessments")
@RequiredArgsConstructor
public class CreditAssessmentController {

    private final CreditAssessmentService assessmentService;

    @PostMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST', 'CREDIT_OFFICER')")
    public ResponseEntity<ApiResponse<AssessmentResponse>> performAssessment(@PathVariable Long applicationId) {
        return ResponseEntity.ok(ApiResponse.ok(assessmentService.performAssessment(applicationId), "Analiz uğurla tamamlandı"));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RISK_ANALYST', 'APPROVER', 'CREDIT_OFFICER')")
    public ResponseEntity<ApiResponse<AssessmentResponse>> getAssessmentByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(ApiResponse.ok(
            assessmentService.getAssessmentByApplication(applicationId).orElse(null)
        ));
    }
}
