package com.seacredit.backend.module.currency;

import com.seacredit.backend.common.enums.CurrencyCode;
import com.seacredit.backend.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.cba.api.url}")
    private String cbaBaseUrl;

    @Transactional
    public void syncRates() {
        syncRates(LocalDate.now());
    }

    @Transactional
    public void syncRates(LocalDate date) {
        String dateStr = date.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"));
        String url = String.format("%s/%s.xml", cbaBaseUrl, dateStr);

        try {
            log.info("Fetching CBAR rates for date: {} from {}", dateStr, url);
            String xmlContent = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (xmlContent == null || xmlContent.isEmpty()) {
                throw new BusinessException("CBAR_API_EMPTY", "CBAR API-dən boş cavab gəldi");
            }

            parseAndSaveRates(xmlContent, date);
            log.info("CBAR rates synchronized successfully for {}", dateStr);

        } catch (Exception e) {
            log.error("Failed to sync rates from CBAR for {}: {}", dateStr, e.getMessage());
            // Fail silently or handle accordingly
        }
    }

    private void parseAndSaveRates(String xml, LocalDate date) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new ByteArrayInputStream(xml.getBytes()));

        NodeList valTypeList = doc.getElementsByTagName("ValType");
        for (int i = 0; i < valTypeList.getLength(); i++) {
            Element valType = (Element) valTypeList.item(i);
            if ("Xarici valyutalar".equals(valType.getAttribute("Type"))) {
                NodeList valuteList = valType.getElementsByTagName("Valute");
                for (int j = 0; j < valuteList.getLength(); j++) {
                    Element valute = (Element) valuteList.item(j);
                    String code = valute.getAttribute("Code");
                    
                    try {
                        CurrencyCode currency = CurrencyCode.valueOf(code);
                        BigDecimal rate = new BigDecimal(valute.getElementsByTagName("Value").item(0).getTextContent());
                        int nominal = Integer.parseInt(valute.getElementsByTagName("Nominal").item(0).getTextContent());
                        
                        BigDecimal actualRate = rate.divide(BigDecimal.valueOf(nominal), 6, BigDecimal.ROUND_HALF_UP);

                        saveOrUpdateRate(currency, actualRate, date);
                    } catch (IllegalArgumentException e) {
                        // Skip currencies we don't care about (e.g. RUB, TRY)
                    }
                }
            }
        }
    }

    private void saveOrUpdateRate(CurrencyCode currency, BigDecimal rate, LocalDate date) {
        Optional<ExchangeRate> existing = exchangeRateRepository.findByCurrencyAndRateDate(currency, date);
        if (existing.isPresent()) {
            ExchangeRate r = existing.get();
            r.setRateToAzn(rate);
            exchangeRateRepository.save(r);
        } else {
            exchangeRateRepository.save(ExchangeRate.builder()
                    .currency(currency)
                    .rateToAzn(rate)
                    .rateDate(date)
                    .source("CBAR")
                    .build());
        }
    }

    @Scheduled(cron = "0 0 9 * * *") // Every day at 9 AM
    public void scheduledSync() {
        syncRates();
    }

    public BigDecimal getRate(CurrencyCode from, LocalDate date) {
        if (from == CurrencyCode.AZN) return BigDecimal.ONE;
        
        return exchangeRateRepository.findByCurrencyAndRateDate(from, date)
                .map(ExchangeRate::getRateToAzn)
                .orElseGet(() -> {
                    log.warn("Rate not found for {} on {}, trying most recent", from, date);
                    return exchangeRateRepository.findFirstByCurrencyOrderByRateDateDesc(from)
                            .map(ExchangeRate::getRateToAzn)
                            .orElseThrow(() -> new BusinessException("CURRENCY_NOT_FOUND", "Valyuta məzənnəsi tapılmadı: " + from));
                });
    }

    public BigDecimal convertToAzn(BigDecimal amount, CurrencyCode from) {
        if (from == CurrencyCode.AZN) return amount;
        BigDecimal rate = getRate(from, LocalDate.now());
        return amount.multiply(rate);
    }
}
