package com.seacredit.backend.module.report;

import com.seacredit.backend.common.enums.LoanAccountStatus;
import com.seacredit.backend.module.application.LoanApplicationRepository;
import com.seacredit.backend.module.customer.CustomerRepository;
import com.seacredit.backend.module.account.LoanAccountRepository;
import com.seacredit.backend.module.account.LoanAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final CustomerRepository customerRepository;
    private final LoanApplicationRepository applicationRepository;
    private final LoanAccountRepository loanAccountRepository;
    private final com.seacredit.backend.module.user.UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardSummary getDashboardSummary() {
        Map<String, Long> statusCounts = new HashMap<>();
        applicationRepository.findAll().forEach(app -> {
            String status = app.getStatus().name();
            statusCounts.put(status, statusCounts.getOrDefault(status, 0L) + 1);
        });

        List<LoanAccount> accounts = loanAccountRepository.findAll();
        BigDecimal totalDisbursed = BigDecimal.ZERO;
        BigDecimal totalOverdue = BigDecimal.ZERO;
        long activeAccounts = 0;
        long overdueCount = 0;

        for (LoanAccount acc : accounts) {
            if (acc.getStatus() == LoanAccountStatus.ACTIVE || acc.getStatus() == LoanAccountStatus.OVERDUE) {
                activeAccounts++;
                totalDisbursed = totalDisbursed.add(acc.getPrincipalAmount());
                if (acc.getStatus() == LoanAccountStatus.OVERDUE) {
                    overdueCount++;
                    totalOverdue = totalOverdue.add(acc.getOutstandingPrincipal()
                            .add(acc.getAccruedInterest())
                            .add(acc.getAccruedPenalty()));
                }
            }
        }

        BigDecimal par = BigDecimal.ZERO;
        if (totalDisbursed.compareTo(BigDecimal.ZERO) > 0) {
            par = totalOverdue.divide(totalDisbursed, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }

        return DashboardSummary.builder()
                .totalCustomers(customerRepository.count())
                .activeApplications(statusCounts.getOrDefault("APPROVED", 0L) + 
                                   statusCounts.getOrDefault("DISBURSED", 0L) +
                                   statusCounts.getOrDefault("ACTIVE", 0L))
                .pendingApplications(statusCounts.getOrDefault("SUBMITTED", 0L) +
                                    statusCounts.getOrDefault("UNDER_REVIEW", 0L))
                .totalLoanAccounts(activeAccounts)
                .totalVerifiedUsers(userRepository.countByVerifiedTrue())
                .totalDisbursedAzn(totalDisbursed)
                .totalOverdueAzn(totalOverdue)
                .portfolioAtRiskPercentage(par)
                .overdueLoanAccounts(overdueCount)
                .applicationsByStatus(statusCounts)
                .build();
    }

    @Transactional(readOnly = true)
    public TrendData getPortfolioTrends() {
        // Get last 6 months data
        LocalDate now = LocalDate.now();
        List<String> labels = new ArrayList<>();
        List<BigDecimal> disbursements = new ArrayList<>();
        List<BigDecimal> repayments = new ArrayList<>();
        List<Long> applicationCounts = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
            
            labels.add(monthStart.format(DateTimeFormatter.ofPattern("MMM", new Locale("az"))));
            
            // Aggregate disbursements for the month
            BigDecimal monthDisbursement = loanAccountRepository.findAll().stream()
                .filter(acc -> acc.getCreatedAt() != null && 
                        !acc.getCreatedAt().toLocalDate().isBefore(monthStart) && 
                        !acc.getCreatedAt().toLocalDate().isAfter(monthEnd))
                .map(acc -> acc.getPrincipalAmount() != null ? acc.getPrincipalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            disbursements.add(monthDisbursement);
            
            // Aggregate repayments (simplified - in real app would sum payments)
            BigDecimal monthRepayment = loanAccountRepository.findAll().stream()
                .filter(acc -> acc.getStatus() == LoanAccountStatus.CLOSED && 
                        acc.getClosedAt() != null &&
                        !acc.getClosedAt().toLocalDate().isBefore(monthStart) && 
                        !acc.getClosedAt().toLocalDate().isAfter(monthEnd))
                .map(acc -> acc.getPrincipalAmount() != null ? acc.getPrincipalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            repayments.add(monthRepayment);
            
            // Count applications for the month
            long monthApplications = applicationRepository.findAll().stream()
                .filter(app -> app.getCreatedAt() != null && 
                        !app.getCreatedAt().toLocalDate().isBefore(monthStart) && 
                        !app.getCreatedAt().toLocalDate().isAfter(monthEnd))
                .count();
            applicationCounts.add(monthApplications);
        }

        return TrendData.builder()
                .labels(labels)
                .disbursementVolume(disbursements)
                .repaymentVolume(repayments)
                .applicationCounts(applicationCounts)
                .build();
    }
}
