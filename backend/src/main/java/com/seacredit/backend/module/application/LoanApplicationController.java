package com.seacredit.backend.module.application;

import com.seacredit.backend.common.response.ApiResponse;
import com.seacredit.backend.module.application.dto.LoanApplicationCreateRequest;
import com.seacredit.backend.module.application.dto.LoanApplicationDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loan-applications")
@RequiredArgsConstructor
public class LoanApplicationController {

    private final LoanApplicationService loanApplicationService;
    private final com.seacredit.backend.module.account.LoanAccountService loanAccountService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CLIENT')")
    public ResponseEntity<ApiResponse<LoanApplicationDto>> createApplication(@Valid @RequestBody LoanApplicationCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.createApplication(request), "Müraciət uğurla yaradıldı"));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CLIENT')")
    public ResponseEntity<ApiResponse<LoanApplicationDto>> submitApplication(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.submitApplication(id), "Müraciət təqdim olundu"));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<List<LoanApplicationDto>>> getMyApplications() {
        return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.getApplicationsByCurrentUser()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_OFFICER', 'RISK_ANALYST', 'APPROVER', 'OPERATOR', 'CASHIER')")
    public ResponseEntity<ApiResponse<List<LoanApplicationDto>>> getAllApplications(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long customerId) {
        
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.searchApplications(q)));
        }
        if (customerId != null) {
            return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.getApplicationsByCustomer(customerId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.getAllApplications()));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'APPROVER')")
    public ResponseEntity<ApiResponse<LoanApplicationDto>> approveApplication(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.approveApplication(id, body.get("notes")), "Müraciət təsdiqləndi"));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_OFFICER', 'APPROVER')")
    public ResponseEntity<ApiResponse<LoanApplicationDto>> rejectApplication(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.rejectApplication(id, body.get("notes")), "Müraciət imtina edildi"));
    }

    @PostMapping("/{id}/disburse")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CASHIER')")
    public ResponseEntity<ApiResponse<com.seacredit.backend.module.account.dto.LoanAccountDto>> disburseLoan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(
            loanAccountService.disburse(id), 
            "Kredit vəsaiti müştəri hesabına köçürüldü"
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize("authenticated")
    public ResponseEntity<ApiResponse<LoanApplicationDto>> getApplicationById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(loanApplicationService.getApplicationById(id)));
    }
}
