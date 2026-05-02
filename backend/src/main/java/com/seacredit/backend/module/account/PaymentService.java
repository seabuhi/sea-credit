package com.seacredit.backend.module.account;

import com.seacredit.backend.common.enums.LoanAccountStatus;
import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final LoanAccountRepository loanAccountRepository;
    private final RepaymentScheduleRepository scheduleRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional
    public PaymentTransaction processPayment(Long accountId, BigDecimal totalAmount, PaymentMethod method, String notes) {
        LoanAccount account = loanAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Kredit hesabı", accountId));

        if (account.getStatus() != LoanAccountStatus.ACTIVE && account.getStatus() != LoanAccountStatus.OVERDUE) {
            throw new BusinessException("Bu hesabda ödəniş qəbul edilə bilməz. Status: " + account.getStatus());
        }

        BigDecimal remaining = totalAmount;
        BigDecimal penaltyPart = BigDecimal.ZERO;
        BigDecimal interestPart = BigDecimal.ZERO;
        BigDecimal principalPart = BigDecimal.ZERO;

        // 1. Pay Penalty first
        if (account.getAccruedPenalty().compareTo(BigDecimal.ZERO) > 0) {
            penaltyPart = remaining.min(account.getAccruedPenalty());
            account.setAccruedPenalty(account.getAccruedPenalty().subtract(penaltyPart));
            remaining = remaining.subtract(penaltyPart);
        }

        // 2. Pay Interest and Principal from installments (FIFO)
        List<RepaymentSchedule> schedules = scheduleRepository.findAllByLoanAccountIdOrderByInstallmentNoAsc(accountId);
        for (RepaymentSchedule inst : schedules) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
            if (inst.getStatus() == com.seacredit.backend.common.enums.ScheduleStatus.PAID) continue;

            // Pay Interest on installment
            BigDecimal interestDue = inst.getInterestDue().subtract(inst.getPaidInterest());
            if (interestDue.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal payInterest = remaining.min(interestDue);
                inst.setPaidInterest(inst.getPaidInterest().add(payInterest));
                interestPart = interestPart.add(payInterest);
                account.setAccruedInterest(account.getAccruedInterest().subtract(payInterest));
                remaining = remaining.subtract(payInterest);
            }

            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;

            // Pay Principal on installment
            BigDecimal principalDue = inst.getPrincipalDue().subtract(inst.getPaidPrincipal());
            if (principalDue.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal payPrincipal = remaining.min(principalDue);
                inst.setPaidPrincipal(inst.getPaidPrincipal().add(payPrincipal));
                principalPart = principalPart.add(payPrincipal);
                account.setOutstandingPrincipal(account.getOutstandingPrincipal().subtract(payPrincipal));
                remaining = remaining.subtract(payPrincipal);
            }

            if (inst.getPaidPrincipal().compareTo(inst.getPrincipalDue()) >= 0 && 
                inst.getPaidInterest().compareTo(inst.getInterestDue()) >= 0) {
                inst.setStatus(com.seacredit.backend.common.enums.ScheduleStatus.PAID);
                inst.setPaidAt(LocalDateTime.now());
            }
        }

        // 3. Handle Over-payment (Advanced - applying to future principal) - Skipped for MVP simplicity
        
        // Finalize account status if fully paid
        if (account.getOutstandingPrincipal().compareTo(BigDecimal.ZERO) <= 0) {
            account.setStatus(LoanAccountStatus.CLOSED);
            account.setClosedAt(java.time.LocalDateTime.now());
        } else if (account.getStatus() == LoanAccountStatus.OVERDUE && !isAnyInstallmentOverdue(account)) {
            account.setStatus(LoanAccountStatus.ACTIVE);
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();

        PaymentTransaction transaction = PaymentTransaction.builder()
                .loanAccount(account)
                .transactionNo(generateTxNo())
                .amount(totalAmount)
                .penaltyPart(penaltyPart)
                .interestPart(interestPart)
                .principalPart(principalPart)
                .paymentMethod(method)
                .notes(notes)
                .receivedBy(currentUser)
                .build();

        transactionRepository.save(transaction);
        loanAccountRepository.save(account);
        
        return transaction;
    }

    private boolean isAnyInstallmentOverdue(LoanAccount account) {
        // Logic to check if current date > due date for any unpaid installment
        return account.getRepaymentSchedules().stream()
                .anyMatch(s -> s.getStatus() != com.seacredit.backend.common.enums.ScheduleStatus.PAID && s.getDueDate().isBefore(java.time.LocalDate.now()));
    }

    private String generateTxNo() {
        return "TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
