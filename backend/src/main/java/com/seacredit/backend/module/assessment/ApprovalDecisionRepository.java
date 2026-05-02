package com.seacredit.backend.module.assessment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalDecisionRepository extends JpaRepository<ApprovalDecision, Long> {
    List<ApprovalDecision> findAllByApplicationIdOrderByDecisionAtDesc(Long applicationId);
}
