package com.seacredit.backend.module.assessment.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class AssessmentResponse {
    private Long id;
    private Integer creditScore;
    private BigDecimal dti;
    private String recommendation;
    private String notes;
    private LocalDateTime assessedAt;
}
