package com.seacredit.backend.module.account;

import com.seacredit.backend.common.response.ApiResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentTransactionRepository transactionRepository;

    @PostMapping("/account/{accountId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<ApiResponse<PaymentTransaction>> processPayment(
            @PathVariable Long accountId,
            @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
            paymentService.processPayment(accountId, request.getAmount(), request.getMethod(), request.getNotes()),
            "Ödəniş uğurla qəbul edildi"
        ));
    }

    @GetMapping("/account/{accountId}")
    @PreAuthorize("authenticated")
    public ResponseEntity<ApiResponse<List<PaymentTransaction>>> getTransactionsByAccount(@PathVariable Long accountId) {
        return ResponseEntity.ok(ApiResponse.ok(transactionRepository.findAllByLoanAccountIdOrderByTransactionDateDesc(accountId)));
    }

    @Data
    public static class PaymentRequest {
        private BigDecimal amount;
        private PaymentMethod method;
        private String notes;
    }
}
