package com.seacredit.backend.common.util;

import com.seacredit.backend.common.enums.InterestType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class AmortizationCalculator {

    @Data
    @Builder
    public static class Installment {
        private int period;
        private LocalDate dueDate;
        private BigDecimal OpeningBalance;
        private BigDecimal principal;
        private BigDecimal interest;
        private BigDecimal totalPayment;
        private BigDecimal closingBalance;
    }

    public static List<Installment> calculate(
            BigDecimal principalAmount,
            BigDecimal annualRate,
            int months,
            InterestType type,
            LocalDate startDate
    ) {
        if (type == InterestType.ANNUITET) {
            return calculateAnnuity(principalAmount, annualRate, months, startDate);
        } else {
            return calculateDifferential(principalAmount, annualRate, months, startDate);
        }
    }

    private static List<Installment> calculateAnnuity(BigDecimal P, BigDecimal annualRate, int n, LocalDate start) {
        List<Installment> schedule = new ArrayList<>();
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        
        // PMT = P * r * (1+r)^n / ((1+r)^n - 1)
        BigDecimal pmt;
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            pmt = P.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        } else {
            BigDecimal factor = monthlyRate.add(BigDecimal.ONE).pow(n);
            pmt = P.multiply(monthlyRate).multiply(factor)
                   .divide(factor.subtract(BigDecimal.ONE), 2, RoundingMode.HALF_UP);
        }

        BigDecimal balance = P;
        for (int i = 1; i <= n; i++) {
            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principal = pmt.subtract(interest);
            
            if (i == n) { // Adjustment for the last installment
                principal = balance;
                pmt = principal.add(interest);
            }

            BigDecimal closing = balance.subtract(principal);
            
            schedule.add(Installment.builder()
                    .period(i)
                    .dueDate(start.plusMonths(i))
                    .OpeningBalance(balance)
                    .principal(principal)
                    .interest(interest)
                    .totalPayment(pmt)
                    .closingBalance(closing)
                    .build());
            
            balance = closing;
        }
        return schedule;
    }

    private static List<Installment> calculateDifferential(BigDecimal P, BigDecimal annualRate, int n, LocalDate start) {
        List<Installment> schedule = new ArrayList<>();
        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 10, RoundingMode.HALF_UP);
        BigDecimal principalPerMonth = P.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        
        BigDecimal balance = P;
        for (int i = 1; i <= n; i++) {
            BigDecimal principal = principalPerMonth;
            if (i == n) principal = balance;

            BigDecimal interest = balance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal pmt = principal.add(interest);
            BigDecimal closing = balance.subtract(principal);

            schedule.add(Installment.builder()
                    .period(i)
                    .dueDate(start.plusMonths(i))
                    .OpeningBalance(balance)
                    .principal(principal)
                    .interest(interest)
                    .totalPayment(pmt)
                    .closingBalance(closing)
                    .build());
            
            balance = closing;
        }
        return schedule;
    }
}
