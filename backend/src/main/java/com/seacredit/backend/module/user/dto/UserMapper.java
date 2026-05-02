package com.seacredit.backend.module.user.dto;

import com.seacredit.backend.module.user.Role;
import com.seacredit.backend.module.user.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roles", source = "roles", qualifiedByName = "rolesToNames")
    UserDto toDto(User user);

    @Named("rolesToNames")
    default Set<String> rolesToNames(Set<Role> roles) {
        if (roles == null) return null;
        return roles.stream().map(Role::getName).collect(Collectors.toSet());
    }
}
