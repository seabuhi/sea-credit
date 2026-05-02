package com.seacredit.backend.module.account;

import com.seacredit.backend.common.response.ApiResponse;
import com.seacredit.backend.module.account.dto.LoanAccountDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loan-accounts")
@RequiredArgsConstructor
public class LoanAccountController {

    private final LoanAccountService loanAccountService;
    private final LoanAccountMapper loanAccountMapper;

    @PostMapping("/disburse/{applicationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<ApiResponse<LoanAccountDto>> disburse(@PathVariable Long applicationId) {
        // We know service returns LoanAccount entity from disburse method currently, 
        // but for API consistency we should map it.
        // Actually, let's update service later or just map here.
        // For now, I'll assume I update service or just use the mapper if available.
        return ResponseEntity.ok(ApiResponse.ok(
            loanAccountMapper.toDto(loanAccountService.disburse(applicationId)), 
            "Kredit uğurla ödənildi (disbursed) və hesab yaradıldı"
        ));
    }

    @GetMapping
    @PreAuthorize("authenticated")
    public ResponseEntity<ApiResponse<List<LoanAccountDto>>> getAllAccounts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long customerId) {
        
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(loanAccountService.searchAccounts(q)));
        }
        if (customerId != null) {
            return ResponseEntity.ok(ApiResponse.ok(loanAccountService.getAccountsByCustomer(customerId)));
        }
        return ResponseEntity.ok(ApiResponse.ok(loanAccountService.getAllAccounts()));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<ApiResponse<List<LoanAccountDto>>> getMyAccounts() {
        return ResponseEntity.ok(ApiResponse.ok(loanAccountService.getAccountsByCurrentUser()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("authenticated")
    public ResponseEntity<ApiResponse<LoanAccountDto>> getAccountById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(loanAccountService.getAccountById(id)));
    }
}
