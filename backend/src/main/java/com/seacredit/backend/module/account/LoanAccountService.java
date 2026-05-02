package com.seacredit.backend.module.account;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.common.enums.LoanAccountStatus;
import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.common.util.AmortizationCalculator;
import com.seacredit.backend.module.account.dto.LoanAccountDto;
import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.application.LoanApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.context.SecurityContextHolder;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanAccountService {

    private final LoanAccountRepository loanAccountRepository;
    private final RepaymentScheduleRepository scheduleRepository;
    private final LoanApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final LoanAccountMapper loanAccountMapper;

    @Transactional
    public LoanAccountDto disburse(Long applicationId) {
        LoanApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", applicationId));

        if (application.getStatus() != ApplicationStatus.APPROVED) {
            throw new BusinessException("Yalniz TƏSDİQLƏNMİŞ müraciətlər ödənişə (disbursement) göndərilə bilər.");
        }

        if (loanAccountRepository.findByApplicationId(applicationId).isPresent()) {
            throw new BusinessException("Bu müraciət üçün artıq kredit hesabı mövcuddur.");
        }

        String accNo = generateAccNo();
        String contractNo = generateContractNo();
        LocalDate today = LocalDate.now();

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);

        LoanAccount account = LoanAccount.builder()
                .accountNo(accNo)
                .contractNo(contractNo)
                .application(application)
                .customer(application.getCustomer())
                .loanProduct(application.getLoanProduct())
                .principalAmount(application.getRequestedAmount())
                .principalAmountAzn(application.getRequestedAmount()) // Assuming AZN for now or could use exchange rate
                .interestRate(application.getLoanProduct().getBaseInterestRate())
                .interestType(application.getLoanProduct().getInterestType())
                .termMonths(application.getRequestedTerm())
                .currency(application.getCurrency())
                .outstandingPrincipal(application.getRequestedAmount())
                .accruedInterest(BigDecimal.ZERO)
                .startDate(today)
                .maturityDate(today.plusMonths(application.getRequestedTerm()))
                .status(LoanAccountStatus.ACTIVE)
                .createdBy(currentUser)
                .build();

        // Generate Schedule
        List<AmortizationCalculator.Installment> installments = AmortizationCalculator.calculate(
                account.getPrincipalAmount(),
                account.getInterestRate(),
                account.getTermMonths(),
                application.getLoanProduct().getInterestType(),
                today
        );

        BigDecimal totalInterest = BigDecimal.ZERO;
        for (AmortizationCalculator.Installment inst : installments) {
            RepaymentSchedule schedule = RepaymentSchedule.builder()
                    .loanAccount(account)
                    .installmentNo(inst.getPeriod())
                    .dueDate(inst.getDueDate())
                    .openingBalance(inst.getOpeningBalance())
                    .principalDue(inst.getPrincipal())
                    .interestDue(inst.getInterest())
                    .totalDue(inst.getTotalPayment())
                    .status(com.seacredit.backend.common.enums.ScheduleStatus.PENDING)
                    .build();
            account.addInstallment(schedule);
            totalInterest = totalInterest.add(inst.getInterest());
        }

        account.setAccruedInterest(totalInterest);

        // Update application status
        application.setStatus(ApplicationStatus.DISBURSED);
        applicationRepository.save(application);

        log.info("Loan disbursed: {}/{} for application {}", accNo, contractNo, application.getApplicationNo());
        LoanAccount savedAccount = loanAccountRepository.save(account);
        return loanAccountMapper.toDto(savedAccount);
    }

    private String generateAccNo() {
        Long seq = loanAccountRepository.getNextAccNoSequence();
        return String.format("ACC-%d-%06d", LocalDate.now().getYear(), seq);
    }

    private String generateContractNo() {
        Long seq = loanAccountRepository.getNextContractNoSequence();
        return String.format("KON-%d-%06d", LocalDate.now().getYear(), seq);
    }

    @Transactional(readOnly = true)
    public List<LoanAccountDto> getAllAccounts() {
        return loanAccountRepository.findAll().stream()
                .map(loanAccountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanAccountDto> searchAccounts(String q) {
        return loanAccountRepository.search(q).stream()
                .map(loanAccountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanAccountDto> getAccountsByCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));
        
        return loanAccountRepository.findByCustomerUserId(currentUser.getId()).stream()
                .map(loanAccountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanAccountDto> getAccountsByCustomer(Long customerId) {
        return loanAccountRepository.findAllByCustomerId(customerId).stream()
                .map(loanAccountMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LoanAccountDto getAccountById(Long id) {
        LoanAccount account = loanAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kredit hesabı", id));
        
        // Ensure schedules are sorted by installment no
        if (account.getRepaymentSchedules() != null) {
            account.getRepaymentSchedules().sort((a, b) -> a.getInstallmentNo().compareTo(b.getInstallmentNo()));
        }
        
        return loanAccountMapper.toDto(account);
    }
}
