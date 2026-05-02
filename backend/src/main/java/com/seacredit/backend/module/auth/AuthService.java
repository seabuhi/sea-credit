package com.seacredit.backend.module.auth;

import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.module.auth.dto.*;
import com.seacredit.backend.module.notification.BrevoEmailService;
import com.seacredit.backend.module.user.*;
import com.seacredit.backend.security.JwtTokenProvider;
import com.seacredit.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserOtpRepository userOtpRepository;
    private final BrevoEmailService emailService;
    private final PasswordEncoder passwordEncoder;

    private static final SecureRandom random = new SecureRandom();

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new BusinessException("İstifadəçi tapılmadı"));

        if (!user.isVerified()) {
            throw new BusinessException("NOT_VERIFIED", "Zəhmət olmasa email ünvanınızı təsdiqləyin");
        }

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshTokenStr = tokenProvider.generateRefreshToken(userPrincipal.getUsername());

        saveRefreshToken(userPrincipal.getId(), refreshTokenStr);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.replace("ROLE_", ""))
                .collect(Collectors.toList());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .userId(userPrincipal.getId())
                .username(userPrincipal.getUsername())
                .fullName(userPrincipal.getFullName())
                .roles(roles)
                .build();
    }

    @Transactional
    public TokenRefreshResponse refresh(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new BusinessException("REFRESH_TOKEN_NOT_FOUND", "Refresh token tapılmadı"));

        if (refreshToken.isRevoked()) {
            throw new BusinessException("TOKEN_REVOKED", "Bu token ləğv edilib");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new BusinessException("TOKEN_EXPIRED", "Refresh token müddəti bitib. Zəhmət olmasa yenidən daxil olun.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = tokenProvider.generateAccessToken(new UsernamePasswordAuthenticationToken(
                new UserPrincipal(user.getId(), user.getUsername(), user.getEmail(), "", user.getFullName(), user.isActive(),
                        user.getRoles().stream().map(Role::getName).collect(Collectors.toList())),
                null,
                user.getRoles().stream().map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + r.getName())).collect(Collectors.toList())
        ));

        return TokenRefreshResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(requestRefreshToken)
                .build();
    }

    @Transactional
    public void signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("USERNAME_EXISTS", "İstifadəçi adı artıq tutulub");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("EMAIL_EXISTS", "Bu email artıq qeydiyyatdan keçib");
        }

        Role clientRole = roleRepository.findByName("CLIENT")
                .orElseThrow(() -> new BusinessException("ROLE_NOT_FOUND", "Default rol tapılmadı"));

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .active(true)
                .verified(false)
                .roles(Set.of(clientRole))
                .build();

        userRepository.save(user);

        // Generate and send OTP
        String code = String.format("%06d", random.nextInt(1000000));
        UserOtp otp = UserOtp.builder()
                .user(user)
                .code(code)
                .purpose("SIGNUP_VERIFICATION")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        userOtpRepository.save(otp);
        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), code);
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "İstifadəçi tapılmadı"));

        if (user.isVerified()) {
            throw new BusinessException("ALREADY_VERIFIED", "Hesab artıq təsdiqlənib");
        }

        UserOtp otp = userOtpRepository.findTopByUserAndPurposeAndUsedOrderByCreatedAtDesc(user, "SIGNUP_VERIFICATION", false)
                .orElseThrow(() -> new BusinessException("OTP_NOT_FOUND", "Təsdiqləmə kodu tapılmadı"));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("OTP_EXPIRED", "Təsdiqləmə kodunun vaxtı bitib");
        }

        if (!otp.getCode().equals(request.getCode())) {
            throw new BusinessException("INVALID_OTP", "Təsdiqləmə kodu yanlışdır");
        }

        otp.setUsed(true);
        userOtpRepository.save(otp);

        user.setVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "İstifadəçi tapılmadı"));

        // Generate and send OTP
        String code = String.format("%06d", random.nextInt(1000000));
        UserOtp otp = UserOtp.builder()
                .user(user)
                .code(code)
                .purpose("PASSWORD_RESET")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        userOtpRepository.save(otp);
        emailService.sendOtpEmail(user.getEmail(), user.getFullName(), code);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "İstifadəçi tapılmadı"));

        UserOtp otp = userOtpRepository.findTopByUserAndPurposeAndUsedOrderByCreatedAtDesc(user, "PASSWORD_RESET", false)
                .orElseThrow(() -> new BusinessException("OTP_NOT_FOUND", "Təsdiqləmə kodu tapılmadı"));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("OTP_EXPIRED", "Təsdiqləmə kodunun vaxtı bitib");
        }

        if (!otp.getCode().equals(request.getCode())) {
            throw new BusinessException("INVALID_OTP", "Təsdiqləmə kodu yanlışdır");
        }

        otp.setUsed(true);
        userOtpRepository.save(otp);

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private void saveRefreshToken(Long userId, String token) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("İstifadəçi tapılmadı"));

        // Delete existing refresh tokens for the user to only allow one active session (optional, depending on policy)
        // For multi-session, just insert. For bank systems, often we revoke others.
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusNanos(refreshExpirationMs * 1000000))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
    }
}
