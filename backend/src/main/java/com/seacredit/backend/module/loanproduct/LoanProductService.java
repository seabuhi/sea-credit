package com.seacredit.backend.module.loanproduct;

import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.module.loanproduct.dto.LoanProductDto;
import com.seacredit.backend.module.loanproduct.dto.LoanProductMapper;
import com.seacredit.backend.module.loanproduct.dto.LoanProductCreateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanProductService {

    private final LoanProductRepository loanProductRepository;
    private final LoanProductMapper loanProductMapper;
    private final com.seacredit.backend.module.user.UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<LoanProductDto> getAllProducts() {
        return loanProductRepository.findAll().stream()
                .map(loanProductMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LoanProductDto> getActiveProducts() {
        return loanProductRepository.findAllByActiveTrue().stream()
                .map(loanProductMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LoanProductDto getProductById(Long id) {
        return loanProductRepository.findById(id)
                .map(loanProductMapper::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("Kredit məhsulu", id));
    }

    @Transactional
    public LoanProductDto createProduct(LoanProductCreateRequest request) {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.seacredit.backend.module.user.User admin = userRepository.findByUsername(username)
                .orElseThrow(() -> new com.seacredit.backend.common.exception.BusinessException("Cari istifadəçi tapılmadı"));

        LoanProduct product = loanProductMapper.toEntity(request);
        product.setCreatedBy(admin);
        product.setActive(true);
        
        return loanProductMapper.toDto(loanProductRepository.save(product));
    }

    @Transactional
    public LoanProductDto updateProduct(Long id, LoanProductCreateRequest request) {
        LoanProduct product = loanProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kredit məhsulu", id));

        // Basic update - can be refined
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setMinAmount(request.getMinAmount());
        product.setMaxAmount(request.getMaxAmount());
        product.setMinTermMonths(request.getMinTermMonths());
        product.setMaxTermMonths(request.getMaxTermMonths());
        product.setBaseInterestRate(request.getBaseInterestRate());
        product.setOriginationFeeRate(request.getOriginationFeeRate());
        product.setMaxDti(request.getMaxDti());
        product.setMinAge(request.getMinAge());
        product.setMaxAge(request.getMaxAge());
        product.setMinIncome(request.getMinIncome());
        product.setInterestType(request.getInterestType());

        return loanProductMapper.toDto(loanProductRepository.save(product));
    }

    @Transactional
    public void toggleStatus(Long id) {
        LoanProduct product = loanProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kredit məhsulu", id));
        product.setActive(!product.isActive());
        loanProductRepository.save(product);
    }
}
