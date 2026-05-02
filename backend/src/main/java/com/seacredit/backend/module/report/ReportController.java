package com.seacredit.backend.module.report;

import com.seacredit.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard-summary")
    public ResponseEntity<ApiResponse<DashboardSummary>> getDashboardSummary() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getDashboardSummary()));
    }

    @GetMapping("/portfolio-trends")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_OFFICER')")
    public ResponseEntity<ApiResponse<TrendData>> getPortfolioTrends() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getPortfolioTrends()));
    }
}
