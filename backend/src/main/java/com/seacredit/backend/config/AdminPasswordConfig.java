package com.seacredit.backend.config;

import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class AdminPasswordConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        userRepository.findByUsername("admin").ifPresent(user -> {
            user.setPasswordHash(passwordEncoder.encode("23042023"));
            user.setVerified(true);
            userRepository.save(user);
            log.info("Admin password updated to '23042023'");
        });
    }
}
