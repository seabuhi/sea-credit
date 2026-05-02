package com.seacredit.backend.module.application;

import com.seacredit.backend.common.enums.ApplicationStatus;
import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.module.application.dto.LoanApplicationCreateRequest;
import com.seacredit.backend.module.application.dto.LoanApplicationDto;
import com.seacredit.backend.module.currency.ExchangeRateService;
import com.seacredit.backend.module.customer.Customer;
import com.seacredit.backend.module.customer.CustomerRepository;
import com.seacredit.backend.module.loanproduct.LoanProduct;
import com.seacredit.backend.module.loanproduct.LoanProductRepository;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanApplicationService {

    private final LoanApplicationRepository loanApplicationRepository;
    private final CustomerRepository customerRepository;
    private final LoanProductRepository loanProductRepository;
    private final UserRepository userRepository;
    private final ExchangeRateService exchangeRateService;
    private final StatusHistoryRepository statusHistoryRepository;
    private final PrescreeningService prescreeningService;
    private final LoanApplicationMapper loanApplicationMapper;

    @Transactional
    public LoanApplicationDto createApplication(LoanApplicationCreateRequest request) {
        Long customerId = request.getCustomerId();
        
        // If customerId is null (typical for client portal), find by current user
        if (customerId == null) {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));
            
            Customer customer = customerRepository.findByUserId(currentUser.getId())
                    .orElseGet(() -> {
                        // Auto-create a basic profile for the client to avoid friction
                        String[] names = currentUser.getFullName().split(" ", 2);
                        return customerRepository.save(Customer.builder()
                                .user(currentUser)
                                .firstName(names[0])
                                .lastName(names.length > 1 ? names[1] : "-")
                                .email(currentUser.getEmail())
                                .mobile(currentUser.getPhone() != null ? currentUser.getPhone() : "000-000-0000")
                                .finCode("AUTO-" + currentUser.getId())
                                .idSerial("AA0000000")
                                .birthDate(LocalDate.of(1990, 1, 1))
                                .employmentStatus(com.seacredit.backend.module.customer.EmploymentStatus.EMPLOYED)
                                .createdBy(currentUser)
                                .build());
                    });
            customerId = customer.getId();
        }

        final Long permanentCustomerId = customerId;
        Customer customer = customerRepository.findById(permanentCustomerId)
                .orElseThrow(() -> new ResourceNotFoundException("Müştəri", permanentCustomerId));

        LoanProduct product = loanProductRepository.findById(request.getLoanProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Kredit məhsulu", request.getLoanProductId()));

        // Update customer financial snapshot if provided
        if (request.getMonthlyIncome() != null) {
            customer.setMonthlyIncome(request.getMonthlyIncome());
        }
        if (request.getEmploymentStatus() != null) {
            try {
                customer.setEmploymentStatus(com.seacredit.backend.module.customer.EmploymentStatus.valueOf(request.getEmploymentStatus()));
            } catch (Exception e) {
                // Ignore invalid enum values
            }
        }
        customerRepository.save(customer);

        // Validate product constraints
        validateApplicationConstraints(product, request);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));

        BigDecimal rate = exchangeRateService.getRate(request.getCurrency(), LocalDate.now());
        BigDecimal amountAzn = request.getRequestedAmount().multiply(rate);

        String appNo = generateAppNo();

        LoanApplication application = LoanApplication.builder()
                .applicationNo(appNo)
                .customer(customer)
                .loanProduct(product)
                .requestedAmount(request.getRequestedAmount())
                .requestedTerm(request.getRequestedTerm())
                .currency(request.getCurrency())
                .requestedAmountAzn(amountAzn)
                .exchangeRateUsed(rate)
                .purpose(request.getPurpose())
                .hasCollateral(request.isHasCollateral())
                .collateralType(request.getCollateralType())
                .collateralDescription(request.getCollateralDescription())
                .collateralEstimatedValue(request.getCollateralEstimatedValue())
                .hasGuarantor(request.isHasGuarantor())
                .guarantorName(request.getGuarantorName())
                .guarantorFin(request.getGuarantorFin())
                .status(ApplicationStatus.DRAFT)
                .createdBy(currentUser)
                .build();

        LoanApplication saved = loanApplicationRepository.save(application);
        saveStatusHistory(saved, null, ApplicationStatus.DRAFT, "Müraciət yaradıldı", currentUser);
        
        return loanApplicationMapper.toDto(saved);
    }

    @Transactional
    public LoanApplicationDto submitApplication(Long id) {
        LoanApplication application = loanApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", id));

        if (application.getStatus() != ApplicationStatus.DRAFT) {
            throw new BusinessException("Yalnız DRAFT statusunda olan müraciətlər təqdim oluna bilər");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));

        // 1. Update status to SUBMITTED
        updateStatus(application, ApplicationStatus.SUBMITTED, "Müraciət təqdim olundu", currentUser);
        application.setSubmittedAt(LocalDateTime.now());

        // 2. Perform Pre-screening
        PrescreeningService.PrescreeningResult result = prescreeningService.check(application);
        application.setPrecheckPassed(result.isPassed());
        application.setPrecheckNotes(result.getNotes());
        application.setPrecheckAt(LocalDateTime.now());

        if (result.isPassed()) {
            updateStatus(application, ApplicationStatus.PRECHECK_PASSED, result.getNotes(), currentUser);
        } else {
            updateStatus(application, ApplicationStatus.PRECHECK_FAILED, result.getNotes(), currentUser);
        }

        return loanApplicationMapper.toDto(loanApplicationRepository.save(application));
    }

    @Transactional
    public LoanApplicationDto approveApplication(Long id, String notes) {
        LoanApplication application = loanApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", id));

        if (application.getStatus() != ApplicationStatus.UNDER_REVIEW) {
            throw new BusinessException("Yalniz ANALİZ mərhələsində olan müraciətlər təsdiqlənə bilər.");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));

        updateStatus(application, ApplicationStatus.APPROVED, notes != null ? notes : "Müraciət təsdiqləndi", currentUser);
        return loanApplicationMapper.toDto(loanApplicationRepository.save(application));
    }

    @Transactional
    public LoanApplicationDto rejectApplication(Long id, String notes) {
        LoanApplication application = loanApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", id));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));

        updateStatus(application, ApplicationStatus.REJECTED, notes != null ? notes : "Müraciət imtina olundu", currentUser);
        return loanApplicationMapper.toDto(loanApplicationRepository.save(application));
    }

    private void updateStatus(LoanApplication application, ApplicationStatus newStatus, String notes, User user) {
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(newStatus);
        saveStatusHistory(application, oldStatus, newStatus, notes, user);
    }

    private void saveStatusHistory(LoanApplication application, ApplicationStatus old, ApplicationStatus newVal, String notes, User user) {
        statusHistoryRepository.save(StatusHistory.builder()
                .application(application)
                .oldStatus(old)
                .newStatus(newVal)
                .notes(notes)
                .changedBy(user)
                .build());
    }

    private void validateApplicationConstraints(LoanProduct product, LoanApplicationCreateRequest request) {
        if (request.getRequestedAmount().compareTo(product.getMinAmount()) < 0 ||
            request.getRequestedAmount().compareTo(product.getMaxAmount()) > 0) {
            throw new BusinessException("Məbləğ məhsul limitlərindən kənardır. (Min: " + product.getMinAmount() + ", Max: " + product.getMaxAmount() + ")");
        }
        if (request.getRequestedTerm() < product.getMinTermMonths() ||
            request.getRequestedTerm() > product.getMaxTermMonths()) {
            throw new BusinessException("Müddət məhsul limitlərindən kənardır. (Min: " + product.getMinTermMonths() + ", Max: " + product.getMaxTermMonths() + ")");
        }
    }

    private String generateAppNo() {
        Long seq = loanApplicationRepository.getNextAppNoSequence();
        return String.format("APP-%d-%06d", LocalDateTime.now().getYear(), seq);
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationDto> getAllApplications() {
        return loanApplicationRepository.findAll().stream()
                .map(loanApplicationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationDto> searchApplications(String q) {
        return loanApplicationRepository.search(q).stream()
                .map(loanApplicationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationDto> getApplicationsByCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Cari istifadəçi tapılmadı"));
        
        return loanApplicationRepository.findAllByCreatedById(currentUser.getId()).stream()
                .map(loanApplicationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanApplicationDto> getApplicationsByCustomer(Long customerId) {
        return loanApplicationRepository.findAllByCustomerId(customerId).stream()
                .map(loanApplicationMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LoanApplicationDto getApplicationById(Long id) {
        return loanApplicationRepository.findById(id)
                .map(loanApplicationMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Müraciət", id));
    }
}
