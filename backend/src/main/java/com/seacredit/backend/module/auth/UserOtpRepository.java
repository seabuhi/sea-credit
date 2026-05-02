package com.seacredit.backend.module.auth;

import com.seacredit.backend.module.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserOtpRepository extends JpaRepository<UserOtp, Long> {
    Optional<UserOtp> findTopByUserAndPurposeAndUsedOrderByCreatedAtDesc(User user, String purpose, boolean used);
    Optional<UserOtp> findByCodeAndPurposeAndUsed(String code, String purpose, boolean used);
}
