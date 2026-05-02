package com.seacredit.backend.module.auth.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String username;
    private String code;
    private String newPassword;
}
