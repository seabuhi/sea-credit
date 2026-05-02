package com.seacredit.backend.module.assessment;

import com.seacredit.backend.common.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;
    private final ApprovalDecisionRepository approvalDecisionRepository;

    @PostMapping("/application/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'APPROVER')")
    public ResponseEntity<ApiResponse<ApprovalDecision>> submitDecision(
            @PathVariable Long applicationId,
            @RequestBody DecisionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
            approvalService.decide(applicationId, request.getDecision(), request.getNotes()),
            "Qərar uğurla qeydə alındı"
        ));
    }

    @GetMapping("/application/{applicationId}")
    @PreAuthorize("authenticated")
    public ResponseEntity<ApiResponse<List<ApprovalDecision>>> getDecisionsByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(ApiResponse.ok(approvalDecisionRepository.findAllByApplicationIdOrderByDecisionAtDesc(applicationId)));
    }

    @Data
    public static class DecisionRequest {
        private Decision decision;
        private String notes;
    }
}
