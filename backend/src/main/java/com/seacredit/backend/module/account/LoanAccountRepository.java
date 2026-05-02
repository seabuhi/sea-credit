package com.seacredit.backend.module.account;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanAccountRepository extends JpaRepository<LoanAccount, Long> {
    Optional<LoanAccount> findByAccountNo(String accountNo);
    Optional<LoanAccount> findByApplicationId(Long applicationId);

    @Query("SELECT l FROM LoanAccount l WHERE " +
           "LOWER(l.accountNo) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(l.customer.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(l.customer.lastName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(l.customer.finCode) LIKE LOWER(CONCAT('%', :q, '%'))")
    java.util.List<LoanAccount> search(String q);

    java.util.List<LoanAccount> findByCustomerUserId(Long userId);

    java.util.List<LoanAccount> findAllByCustomerId(Long customerId);

    @Query(value = "SELECT nextval('acc_no_seq')", nativeQuery = true)
    Long getNextAccNoSequence();

    @Query(value = "SELECT nextval('contract_no_seq')", nativeQuery = true)
    Long getNextContractNoSequence();
}
