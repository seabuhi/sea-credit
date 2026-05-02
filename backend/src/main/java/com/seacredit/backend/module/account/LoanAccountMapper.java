package com.seacredit.backend.module.account;

import com.seacredit.backend.module.account.dto.LoanAccountDto;
import com.seacredit.backend.module.account.dto.RepaymentScheduleDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LoanAccountMapper {

    @Mapping(target = "applicationId", source = "application.id")
    @Mapping(target = "customerFullName", expression = "java(account.getCustomer().getFirstName() + \" \" + account.getCustomer().getLastName())")
    @Mapping(target = "customerFin", source = "customer.finCode")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "loanProductName", source = "loanProduct.name")
    @Mapping(target = "balancePrincipal", source = "outstandingPrincipal")
    @Mapping(target = "balanceInterest", source = "accruedInterest")
    @Mapping(target = "balancePenalty", source = "accruedPenalty")
    @Mapping(target = "disbursementDate", source = "startDate")
    @Mapping(target = "nextPaymentDate", expression = "java(getNextPaymentDate(account))")
    LoanAccountDto toDto(LoanAccount account);

    @Mapping(target = "principalAmount", source = "principalDue")
    @Mapping(target = "interestAmount", source = "interestDue")
    @Mapping(target = "totalAmount", source = "totalDue")
    @Mapping(target = "paidAmount", source = "paidTotal")
    RepaymentScheduleDto toDto(RepaymentSchedule schedule);

    default java.time.LocalDate getNextPaymentDate(LoanAccount account) {
        if (account.getRepaymentSchedules() == null) return null;
        return account.getRepaymentSchedules().stream()
                .filter(s -> s.getStatus() == com.seacredit.backend.common.enums.ScheduleStatus.PENDING || 
                            s.getStatus() == com.seacredit.backend.common.enums.ScheduleStatus.OVERDUE)
                .map(RepaymentSchedule::getDueDate)
                .min(java.time.LocalDate::compareTo)
                .orElse(null);
    }
}
