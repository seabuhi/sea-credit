package com.seacredit.backend.module.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendData {
    private List<String> labels;
    private List<BigDecimal> disbursementVolume;
    private List<BigDecimal> repaymentVolume;
    private List<Long> applicationCounts;
}
