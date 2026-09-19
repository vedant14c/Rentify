package com.officespace.converters;

import com.officespace.entities.RequestType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RequestTypeConverter implements AttributeConverter<RequestType, String> {

    @Override
    public String convertToDatabaseColumn(RequestType attribute) {
        return attribute != null ? attribute.name() : RequestType.RENTAL.name();
    }

    @Override
    public RequestType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return RequestType.RENTAL;
        }

        String normalized = dbData.trim().toUpperCase();

        try {
            return RequestType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("PURCHASE") || normalized.contains("BUY")) {
                return RequestType.PURCHASE;
            }
            return RequestType.RENTAL;
        }
    }
}
