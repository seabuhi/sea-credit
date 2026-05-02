package com.seacredit.backend.module.loanproduct;

import com.seacredit.backend.common.response.ApiResponse;
import com.seacredit.backend.module.loanproduct.dto.LoanProductDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/loan-products")
@RequiredArgsConstructor
public class LoanProductController {

    private final LoanProductService loanProductService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LoanProductDto>>> getActiveProducts() {
        return ResponseEntity.ok(ApiResponse.ok(loanProductService.getActiveProducts()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_OFFICER')")
    public ResponseEntity<ApiResponse<List<LoanProductDto>>> getAllProducts() {
        return ResponseEntity.ok(ApiResponse.ok(loanProductService.getAllProducts()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoanProductDto>> createProduct(@Valid @RequestBody com.seacredit.backend.module.loanproduct.dto.LoanProductCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(loanProductService.createProduct(request), "Məhsul uğurla yaradıldı"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoanProductDto>> updateProduct(@PathVariable Long id, @Valid @RequestBody com.seacredit.backend.module.loanproduct.dto.LoanProductCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(loanProductService.updateProduct(id, request), "Məhsul məlumatları yeniləndi"));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(@PathVariable Long id) {
        loanProductService.toggleStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Məhsul statusu dəyişdirildi"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LoanProductDto>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(loanProductService.getProductById(id)));
    }
}
