package com.seacredit.backend.module.customer;

import com.seacredit.backend.common.exception.BusinessException;
import com.seacredit.backend.common.exception.ResourceNotFoundException;
import com.seacredit.backend.module.customer.dto.CustomerCreateRequest;
import com.seacredit.backend.module.customer.dto.CustomerDto;
import com.seacredit.backend.module.customer.dto.CustomerMapper;
import com.seacredit.backend.module.user.User;
import com.seacredit.backend.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final CustomerMapper customerMapper;

    @Transactional(readOnly = true)
    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(customerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Müştəri", id));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "İstifadəçi tapılmadı"));

        boolean isClient = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_CLIENT") || r.getName().equals("CLIENT"));
        
        // Security check: Client can only view their own record or records they created
        boolean isOwner = (customer.getUser() != null && customer.getUser().getId().equals(currentUser.getId())) ||
                         (customer.getCreatedBy() != null && customer.getCreatedBy().getId().equals(currentUser.getId()));

        if (isClient && !isOwner) {
            throw new BusinessException("ACCESS_DENIED", "Bu əməliyyat üçün icazəniz yoxdur");
        }

        return customerMapper.toDto(customer);
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerByFin(String finCode) {
        return customerRepository.findByFinCode(finCode)
                .map(customerMapper::toDto)
                .orElseThrow(() -> new BusinessException("CUSTOMER_NOT_FOUND", "FİN kodlu müştəri tapılmadı: " + finCode));
    }

    @Transactional
    public CustomerDto createCustomer(CustomerCreateRequest request) {
        if (customerRepository.existsByFinCode(request.getFinCode())) {
            throw new BusinessException("FIN_EXISTS", "Bu FİN kod ilə artıq müştəri mövcuddur");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("Sistem xətası: Cari istifadəçi tapılmadı"));

        Customer customer = Customer.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .middleName(request.getMiddleName())
                .finCode(request.getFinCode())
                .idSerial(request.getIdSerial())
                .birthDate(request.getBirthDate())
                .mobile(request.getMobile())
                .email(request.getEmail())
                .address(request.getAddress())
                .city(request.getCity())
                .employmentStatus(EmploymentStatus.valueOf(request.getEmploymentStatus()))
                .employerName(request.getEmployerName())
                .monthlyIncome(request.getMonthlyIncome())
                .incomeCurrency(request.getIncomeCurrency())
                .createdBy(currentUser)
                .user(currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_CLIENT")) ? currentUser : null)
                .build();

        return customerMapper.toDto(customerRepository.save(customer));
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> searchCustomers(String query) {
        return customerRepository.search(query).stream()
                .map(customerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto getMine() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "İstifadəçi tapılmadı"));
        
        return customerRepository.findByUserId(user.getId())
                .map(customerMapper::toDto)
                .orElseThrow(() -> new BusinessException("CUSTOMER_NOT_FOUND", "Profil məlumatlarınız tapılmadı. Zəhmət olmasa KYC doldurun."));
    }

    @Transactional
    public CustomerDto updateMyProfile(CustomerCreateRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "İstifadəçi tapılmadı"));

        Customer customer = customerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException("CUSTOMER_NOT_FOUND", "Profil məlumatlarınız tapılmadı."));

        // Check if FIN code is changed and if new FIN is already taken by ANOTHER customer
        if (!customer.getFinCode().equalsIgnoreCase(request.getFinCode()) && 
            customerRepository.existsByFinCode(request.getFinCode())) {
            throw new BusinessException("FIN_EXISTS", "Bu FİN kod artıq başqa bir müştəri tərəfindən istifadə olunur: " + request.getFinCode());
        }

        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setMiddleName(request.getMiddleName());
        customer.setFinCode(request.getFinCode());
        customer.setIdSerial(request.getIdSerial());
        customer.setBirthDate(request.getBirthDate());
        customer.setMobile(request.getMobile());
        customer.setEmail(request.getEmail());
        customer.setAddress(request.getAddress());
        customer.setCity(request.getCity());
        
        if (request.getEmploymentStatus() != null) {
            customer.setEmploymentStatus(EmploymentStatus.valueOf(request.getEmploymentStatus()));
        }
        customer.setEmployerName(request.getEmployerName());
        customer.setMonthlyIncome(request.getMonthlyIncome());
        customer.setIncomeCurrency(request.getIncomeCurrency());

        return customerMapper.toDto(customerRepository.save(customer));
    }
}
