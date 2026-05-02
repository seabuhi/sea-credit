package com.seacredit.backend.module.assessment;

import com.seacredit.backend.module.application.LoanApplication;
import com.seacredit.backend.module.customer.Customer;
import com.seacredit.backend.module.customer.CustomerRepository;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreditBureauService {

    private final BureauQueryRepository bureauQueryRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Transactional
    public BureauQuery queryBureau(LoanApplication application) {
        Customer customer = application.getCustomer();

        log.info("Querying AKB for customer: {} (FIN: {})", customer.getFirstName() + " " + customer.getLastName(), customer.getFinCode());

        // Simulate API call to AKB
        BureauQuery result = simulateAkbResponse(application);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElse(null);
        result.setQueriedBy(currentUser);

        // Update customer's latest score/time
        customer.setCreditScore(result.getScore());
        customer.setBureauCheckedAt(LocalDateTime.now());
        customerRepository.save(customer);

        return bureauQueryRepository.save(result);
    }

    private BureauQuery simulateAkbResponse(LoanApplication application) {
        Customer customer = application.getCustomer();
        Random random = new Random();
        
        // Logical simulation based on FIN or random
        int score = 300 + random.nextInt(600); // 300 to 900
        boolean hasLoans = random.nextBoolean();
        BigDecimal debt = hasLoans ? BigDecimal.valueOf(random.nextInt(10000)) : BigDecimal.ZERO;
        BigDecimal payment = hasLoans ? debt.divide(BigDecimal.valueOf(12), 2, BigDecimal.ROUND_HALF_UP) : BigDecimal.ZERO;

        return BureauQuery.builder()
                .application(application)
                .customer(customer)
                .finCode(customer.getFinCode())
                .externalReference(UUID.randomUUID().toString())
                .score(score)
                .hasActiveLoans(hasLoans)
                .totalDebtAzn(debt)
                .monthlyPaymentAzn(payment)
                .responseJson("{\"status\": \"SUCCESS\", \"provider\": \"AKB\", \"simulated\": true}")
                .build();
    }
}
