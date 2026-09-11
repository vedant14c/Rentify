package com.officespace.converters;

import com.officespace.entities.NotificationType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

    @Override
    public String convertToDatabaseColumn(NotificationType attribute) {
        return attribute != null ? attribute.name() : NotificationType.SYSTEM.name();
    }

    @Override
    public NotificationType convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return NotificationType.SYSTEM;
        }

        String normalized = dbData.trim().toUpperCase();

        try {
            return NotificationType.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            if (normalized.contains("PROPERTY")) return NotificationType.PROPERTY;
            if (normalized.contains("RENT") || normalized.contains("BOOKING")) return NotificationType.RENTAL;
            if (normalized.contains("REVIEW")) return NotificationType.REVIEW;
            return NotificationType.SYSTEM;
        }
    }
}
