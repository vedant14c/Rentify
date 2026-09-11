package com.officespace.mappers;

import com.officespace.dtos.BookedDateRangeDTO;
import com.officespace.dtos.BookingSummaryDTO;
import com.officespace.dtos.PropertyAvailabilityDTO;
import com.officespace.entities.Property;
import com.officespace.entities.PropertyRequest;
import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public PropertyAvailabilityDTO toAvailabilityDTO(
            Property property,
            List<BookedDateRangeDTO> dateRanges,
            LocalDate nextAvailableDate,
            long monthlyBookingsCount,
            long holdMinutes
    ) {
        if (property == null) return null;

        PropertyAvailabilityDTO dto = new PropertyAvailabilityDTO();
        dto.setBookingMode(property.getBookingMode() != null ? property.getBookingMode().name() : "INSTANT");
        dto.setPriceUnit(property.getPriceUnit() != null ? property.getPriceUnit() : "MONTH");
        dto.setOpeningTime(property.getOpeningTime());
        dto.setClosingTime(property.getClosingTime());
        dto.setSlotDurationMinutes(property.getSlotDurationMinutes());
        dto.setBookedDateRanges(dateRanges);
        dto.setNextAvailableDate(nextAvailableDate);
        dto.setMonthlyBookingsCount(monthlyBookingsCount);
        dto.setHoldMinutes(holdMinutes);
        return dto;
    }

    public BookingSummaryDTO toSummaryDTO(PropertyRequest request, Property property) {
        if (request == null) return null;

        BookingSummaryDTO dto = new BookingSummaryDTO();
        dto.setRequestId(request.getRequestId());
        dto.setPropertyId(request.getPropertyId());
        dto.setUserId(request.getUserId());
        dto.setStatus(request.getStatus() != null ? request.getStatus().name() : "PENDING");
        dto.setProposedStart(request.getProposedStart());
        dto.setProposedEnd(request.getProposedEnd());
        dto.setOfferPrice(request.getOfferPrice());
        dto.setMessage(request.getMessage());
        dto.setCreatedAt(request.getCreatedAt());

        if (property != null) {
            dto.setPropertyName(property.getTitle());
            dto.setPropertyType(property.getPropertyType());
            dto.setCity(property.getCity());
            dto.setBookingMode(property.getBookingMode() != null ? property.getBookingMode().name() : "INSTANT");
        }

        return dto;
    }
}
