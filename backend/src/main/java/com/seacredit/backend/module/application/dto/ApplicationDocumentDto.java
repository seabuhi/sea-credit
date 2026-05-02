package com.seacredit.backend.module.application.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ApplicationDocumentDto {
    private Long id;
    private String documentType;
    private String fileName;
    private String status;
    private LocalDateTime uploadedAt;
}
