package com.seacredit.backend.module.application;

import com.seacredit.backend.module.application.dto.ApplicationDocumentDto;
import com.seacredit.backend.module.application.dto.LoanApplicationDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LoanApplicationMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerFullName", expression = "java(application.getCustomer().getFirstName() + \" \" + application.getCustomer().getLastName())")
    @Mapping(target = "customerFin", source = "customer.finCode")
    @Mapping(target = "loanProductId", source = "loanProduct.id")
    @Mapping(target = "loanProductName", source = "loanProduct.name")
    LoanApplicationDto toDto(LoanApplication application);

    @Mapping(target = "status", ignore = true)
    ApplicationDocumentDto toDto(ApplicationDocument document);
}
