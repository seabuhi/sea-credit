package com.seacredit.backend.module.application.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class LoanAssessmentDto {
    private Long id;
    private String internalRating;
    private BigDecimal calculatedDti;
    private Integer score;
    private boolean recommended;
    private String assessmentNotes;
    private String assessedByFullName;
    private LocalDateTime assessedAt;
}
