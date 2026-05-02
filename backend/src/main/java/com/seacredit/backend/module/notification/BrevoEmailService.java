package com.seacredit.backend.module.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class BrevoEmailService {

    private final WebClient.Builder webClientBuilder;

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.api.url}")
    private String apiUrl;

    @Value("${brevo.email.from}")
    private String fromEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    public void sendOtpEmail(String toEmail, String fullName, String otpCode) {
        Map<String, Object> body = Map.of(
            "sender", Map.of("name", senderName, "email", fromEmail),
            "to", List.of(Map.of("email", toEmail, "name", fullName)),
            "subject", "Sea-Credit Təsdiqləmə Kodu",
            "htmlContent", String.format(
                "<html><body>" +
                "<h2>Hörmətli %s,</h2>" +
                "<p>Sea-Credit sisteminə qeydiyyat üçün təsdiqləmə kodunuz:</p>" +
                "<h1 style='color: #2563eb; letter-spacing: 5px;'>%s</h1>" +
                "<p>Bu kod 10 dəqiqə ərzində etibarlıdır.</p>" +
                "<p>Əgər bu müraciəti siz etməmisinizsə, zəhmət olmasa bu məktubu görməzdən gəlin.</p>" +
                "</body></html>", fullName, otpCode)
        );

        webClientBuilder.build()
            .post()
            .uri(apiUrl)
            .header("api-key", apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(body)
            .retrieve()
            .toBodilessEntity()
            .doOnSuccess(response -> log.info("OTP email sent successfully to {}", toEmail))
            .doOnError(error -> log.error("Failed to send OTP email to {}: {}", toEmail, error.getMessage()))
            .subscribe();
    }
}
