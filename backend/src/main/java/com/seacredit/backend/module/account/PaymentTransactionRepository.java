package com.seacredit.backend.module.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findAllByLoanAccountIdOrderByTransactionDateDesc(Long loanAccountId);
}
