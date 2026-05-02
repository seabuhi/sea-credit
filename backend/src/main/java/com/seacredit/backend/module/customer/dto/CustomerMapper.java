package com.seacredit.backend.module.customer.dto;

import com.seacredit.backend.module.customer.Customer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    CustomerDto toDto(Customer customer);
}
