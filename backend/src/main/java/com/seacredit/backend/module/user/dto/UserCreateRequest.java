package com.seacredit.backend.module.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.Set;

@Data
public class UserCreateRequest {
    @NotBlank(message = "İstifadəçi adı boş ola bilməz")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Email boş ola bilməz")
    @Email(message = "Email formatı yanlışdır")
    private String email;

    @NotBlank(message = "Şifrə boş ola bilməz")
    @Size(min = 6, max = 100)
    private String password;

    @NotBlank(message = "Tam ad boş ola bilməz")
    private String fullName;

    private String phone;

    @NotEmpty(message = "Ən azı bir rol seçilməlidir")
    private Set<String> roles;
}
