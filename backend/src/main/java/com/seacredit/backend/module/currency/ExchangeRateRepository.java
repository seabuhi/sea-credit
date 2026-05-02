package com.seacredit.backend.module.currency;

import com.seacredit.backend.common.enums.CurrencyCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    Optional<ExchangeRate> findByCurrencyAndRateDate(CurrencyCode currency, LocalDate rateDate);
    Optional<ExchangeRate> findFirstByCurrencyOrderByRateDateDesc(CurrencyCode currency);
}
