package com.seacredit.backend.module.report;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
public class DashboardSummary {
    private long totalCustomers;
    private long activeApplications;
    private long pendingApplications;
    private long totalLoanAccounts;
    private long totalVerifiedUsers;
    private BigDecimal totalDisbursedAzn;
    private BigDecimal totalOverdueAzn;
    private BigDecimal portfolioAtRiskPercentage;
    private long overdueLoanAccounts;
    private Map<String, Long> applicationsByStatus;
}
