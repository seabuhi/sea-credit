package com.seacredit.backend.module.loanproduct.dto;

import com.seacredit.backend.module.loanproduct.LoanProduct;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LoanProductMapper {
    LoanProductDto toDto(LoanProduct p);
    LoanProduct toEntity(LoanProductCreateRequest request);
}
