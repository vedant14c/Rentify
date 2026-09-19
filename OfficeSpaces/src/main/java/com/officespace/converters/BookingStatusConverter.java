package com.officespace.converters;

import com.officespace.entities.BookingStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class BookingStatusConverter implements AttributeConverter<BookingStatus, String> {

    @Override
    public String convertToDatabaseColumn(BookingStatus attribute) {
        return attribute != null ? attribute.name() : BookingStatus.PENDING.name();
    }

    @Override
    public BookingStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return BookingStatus.PENDING;
        }

        String normalized = dbData.trim().toUpperCase();

        try {
            return BookingStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if ("ACCEPTED".equals(normalized) || "APPROVED_BY_OWNER".equals(normalized)) {
                return BookingStatus.APPROVED;
            }
            if ("DECLINED".equals(normalized)) {
                return BookingStatus.REJECTED;
            }
            if ("COMPLETED".equals(normalized) || "PAID".equals(normalized)) {
                return BookingStatus.CONFIRMED;
            }
            return BookingStatus.PENDING;
        }
    }
}
