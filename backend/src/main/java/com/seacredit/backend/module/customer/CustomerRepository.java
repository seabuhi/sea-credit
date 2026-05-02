package com.seacredit.backend.module.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByFinCode(String finCode);
    Optional<Customer> findByUserId(Long userId);
    boolean existsByFinCode(String finCode);

    @Query("SELECT c FROM Customer c WHERE " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "c.finCode LIKE CONCAT('%', :q, '%') OR " +
           "c.mobile LIKE CONCAT('%', :q, '%')")
    List<Customer> search(@Param("q") String query);
}
