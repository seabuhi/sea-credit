package com.seacredit.backend.module.scheduler;

import com.seacredit.backend.common.enums.LoanAccountStatus;
import com.seacredit.backend.module.account.LoanAccount;
import com.seacredit.backend.module.account.LoanAccountRepository;
import com.seacredit.backend.module.account.RepaymentSchedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OverdueScheduler {

    private final LoanAccountRepository loanAccountRepository;

    @Scheduled(cron = "0 0 1 * * *") // Every day at 1 AM
    @Transactional
    public void processOverdueLoans() {
        log.info("Starting automated overdue and penalty processing...");
        
        List<LoanAccount> activeLoans = loanAccountRepository.findAll().stream()
                .filter(acc -> acc.getStatus() == LoanAccountStatus.ACTIVE || acc.getStatus() == LoanAccountStatus.OVERDUE)
                .toList();

        LocalDate today = LocalDate.now();
        int processedCount = 0;

        for (LoanAccount account : activeLoans) {
            BigDecimal dailyPenalty = BigDecimal.ZERO;
            boolean isAnyOverdue = false;

            for (RepaymentSchedule installment : account.getRepaymentSchedules()) {
                if (installment.getStatus() != com.seacredit.backend.common.enums.ScheduleStatus.PAID && installment.getDueDate().isBefore(today)) {
                    isAnyOverdue = true;
                    // Calculate daily penalty for THIS installment
                    // Formula: Unpaid Principal * 0.1% (configurable per product, but hardcoded here for simplicity)
                    BigDecimal unpaidPrincipal = installment.getPrincipalDue().subtract(installment.getPaidPrincipal());
                    if (unpaidPrincipal.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal penaltyRate = BigDecimal.valueOf(0.001); // 0.1% per day
                        dailyPenalty = dailyPenalty.add(unpaidPrincipal.multiply(penaltyRate));
                    }
                }
            }

            if (isAnyOverdue) {
                account.setStatus(LoanAccountStatus.OVERDUE);
                if (dailyPenalty.compareTo(BigDecimal.ZERO) > 0) {
                    account.setAccruedPenalty(account.getAccruedPenalty().add(dailyPenalty.setScale(2, RoundingMode.HALF_UP)));
                    log.debug("Applied {} penalty to account {}", dailyPenalty, account.getAccountNo());
                }
                loanAccountRepository.save(account);
                processedCount++;
            }
        }

        log.info("Overdue processing completed. {} loans updated.", processedCount);
    }
}
