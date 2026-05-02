package com.seacredit.backend.module.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long> {
    Optional<LoanApplication> findByApplicationNo(String applicationNo);

    @Query("SELECT l FROM LoanApplication l WHERE " +
           "LOWER(l.applicationNo) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(l.customer.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(l.customer.lastName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(l.customer.finCode) LIKE LOWER(CONCAT('%', :q, '%'))")
    java.util.List<LoanApplication> search(String q);

    java.util.List<LoanApplication> findAllByCustomerId(Long customerId);
    java.util.List<LoanApplication> findAllByCreatedById(Long userId);

    @Query(value = "SELECT nextval('app_no_seq')", nativeQuery = true)
    Long getNextAppNoSequence();
}
