package com.officespace.converters;

import com.officespace.entities.Role;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role attribute) {
        return attribute != null ? attribute.name() : Role.USER.name();
    }

    @Override
    public Role convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Role.USER;
        }

        String normalized = dbData.trim().toUpperCase();

        try {
            return Role.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("ADMIN")) return Role.ADMIN;
            if (normalized.contains("OWNER") || normalized.contains("LESSOR")) return Role.OWNER;
            if (normalized.contains("TENANT") || normalized.contains("RENTER") || normalized.contains("CLIENT")) return Role.USER;
            return Role.USER;
        }
    }
}
