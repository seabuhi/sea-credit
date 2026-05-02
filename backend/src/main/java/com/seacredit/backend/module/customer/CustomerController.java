package com.seacredit.backend.module.customer;

import com.seacredit.backend.common.response.ApiResponse;
import com.seacredit.backend.module.customer.dto.CustomerCreateRequest;
import com.seacredit.backend.module.customer.dto.CustomerDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CREDIT_OFFICER')")
    public ResponseEntity<ApiResponse<List<CustomerDto>>> getAllCustomers(@RequestParam(required = false) String q) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(customerService.searchCustomers(q)));
        }
        return ResponseEntity.ok(ApiResponse.ok(customerService.getAllCustomers()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CREDIT_OFFICER', 'CLIENT', 'ROLE_CLIENT')")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getCustomerById(id)));
    }

    @GetMapping("/fin/{fin}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CREDIT_OFFICER')")
    public ResponseEntity<ApiResponse<CustomerDto>> getCustomerByFin(@PathVariable String fin) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getCustomerByFin(fin)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR', 'CLIENT')")
    public ResponseEntity<ApiResponse<CustomerDto>> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.createCustomer(request), "Müştəri uğurla yaradildi"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CustomerDto>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getMine()));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<CustomerDto>> updateMyProfile(@Valid @RequestBody CustomerCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.updateMyProfile(request), "Profil məlumatları yeniləndi"));
    }
}
