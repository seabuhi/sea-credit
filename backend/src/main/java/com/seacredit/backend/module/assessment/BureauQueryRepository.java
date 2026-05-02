package com.seacredit.backend.module.assessment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BureauQueryRepository extends JpaRepository<BureauQuery, Long> {
    List<BureauQuery> findAllByCustomerIdOrderByQueryDateDesc(Long customerId);
}
