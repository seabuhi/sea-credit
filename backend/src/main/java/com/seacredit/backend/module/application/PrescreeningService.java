package com.seacredit.backend.module.application;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.module.customer.Customer;
import com.seacredit.backend.module.loanproduct.LoanProduct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
public class PrescreeningService {

    public PrescreeningResult check(LoanApplication application) {
        Customer customer = application.getCustomer();
        LoanProduct product = application.getLoanProduct();

        // 1. Blacklist check
        if (customer.isBlacklisted()) {
            return PrescreeningResult.fail("Müştəri qara siyahıdadır: " + customer.getBlacklistReason());
        }

        // 2. Age check
        int age = Period.between(customer.getBirthDate(), LocalDate.now()).getYears();
        if (age < product.getMinAge() || age > product.getMaxAge()) {
            return PrescreeningResult.fail("Müştərinin yaşı məhsul tələblərinə uyğun deyil. Yaş: " + age + 
                                         ", Tənzimlənən aralıq: [" + product.getMinAge() + "-" + product.getMaxAge() + "]");
        }

        // 3. Minimum income check (if defined)
        if (product.getMinIncome() != null && customer.getMonthlyIncome() != null) {
            if (customer.getMonthlyIncome().compareTo(product.getMinIncome()) < 0) {
                return PrescreeningResult.fail("Müştərinin gəliri minimum tələbdən aşağıdır. Gəlir: " + 
                                             customer.getMonthlyIncome() + " AZN, Tələb: " + product.getMinIncome() + " AZN");
            }
        }

        return PrescreeningResult.pass("İlkin yoxlamadan keçdi.");
    }

    @lombok.Value
    public static class PrescreeningResult {
        boolean passed;
        String notes;

        public static PrescreeningResult pass(String notes) { return new PrescreeningResult(true, notes); }
        public static PrescreeningResult fail(String notes) { return new PrescreeningResult(false, notes); }
    }
}
