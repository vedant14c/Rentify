package com.officespace.converters;

import com.officespace.entities.BookingMode;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BookingModeConverter implements AttributeConverter<BookingMode, String> {

    @Override
    public String convertToDatabaseColumn(BookingMode attribute) {
        return attribute != null ? attribute.name() : BookingMode.INSTANT.name();
    }

    @Override
    public BookingMode convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return BookingMode.INSTANT;
        }

        String normalized = dbData.trim().toUpperCase();

        try {
            return BookingMode.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if ("APPROVAL".equals(normalized) || "OWNER_APPROVAL".equals(normalized) || "REQUEST".equals(normalized)) {
                return BookingMode.APPROVAL;
            }
            return BookingMode.INSTANT;
        }
    }
}
