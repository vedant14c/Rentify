package com.officespace.services;

import com.officespace.daos.PropertyRequestDao;
import com.officespace.entities.BookingStatus;
import com.officespace.entities.Property;
import com.officespace.entities.PropertyRequest;
import com.officespace.utils.BookingDateUtils;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BookingValidationService {

    @Autowired
    private PropertyRequestDao requestDao;

    @Value("${booking.payment.hold-minutes:15}")
    private long holdMinutes;

    public LocalDateTime getCutoffTime() {
        return LocalDateTime.now().minusMinutes(holdMinutes);
    }

    public List<BookingStatus> getActiveStatuses() {
        return List.of(
            BookingStatus.CONFIRMED, BookingStatus.confirmed,
            BookingStatus.APPROVED, BookingStatus.approved,
            BookingStatus.PAID, BookingStatus.paid,
            BookingStatus.ACCEPTED, BookingStatus.accepted
        );
    }

    public boolean hasOverlap(Integer propertyId, LocalDate start, LocalDate end) {
        if (propertyId == null || start == null || end == null) return false;
        long count = requestDao.countOverlappingBookings(
                propertyId,
                start,
                end,
                getActiveStatuses(),
                BookingStatus.PENDING_PAYMENT,
                getCutoffTime()
        );
        return count > 0;
    }

    public boolean hasOverlapExcludingRequest(Integer propertyId, Integer requestId, LocalDate start, LocalDate end) {
        if (propertyId == null || start == null || end == null) return false;
        long count = requestDao.countOverlappingBookingsExcludingRequest(
                propertyId,
                requestId,
                start,
                end,
                getActiveStatuses(),
                BookingStatus.PENDING_PAYMENT,
                getCutoffTime()
        );
        return count > 0;
    }

    public boolean hasHourlyOverlap(Integer propertyId, LocalDate bookingDate, LocalTime startTime, LocalTime endTime) {
        if (propertyId == null || bookingDate == null || startTime == null || endTime == null) {
            return false;
        }

        return requestDao.countOverlappingHourlyBookings(
                propertyId,
                bookingDate,
                startTime,
                endTime,
                getActiveStatuses(),
                BookingStatus.PENDING_PAYMENT,
                getCutoffTime()
        ) > 0;
    }

    public boolean hasHourlyOverlapExcludingRequest(
            Integer propertyId,
            Integer requestId,
            LocalDate bookingDate,
            LocalTime startTime,
            LocalTime endTime
    ) {
        if (propertyId == null || requestId == null || bookingDate == null || startTime == null || endTime == null) {
            return false;
        }

        return requestDao.countOverlappingHourlyBookingsExcludingRequest(
                propertyId,
                requestId,
                bookingDate,
                startTime,
                endTime,
                getActiveStatuses(),
                BookingStatus.PENDING_PAYMENT,
                getCutoffTime()
        ) > 0;
    }

    public void validateHourlyBooking(PropertyRequest request, Property property) {
        if (request == null || property == null) {
            throw new IllegalArgumentException("Hourly booking details are required.");
        }

        if (request.getProposedStart() == null || request.getProposedEnd() == null) {
            throw new IllegalArgumentException("An hourly booking date is required.");
        }
        if (!request.getProposedStart().equals(request.getProposedEnd())) {
            throw new IllegalArgumentException("Hourly bookings must start and end on the same date.");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new IllegalArgumentException("Hourly booking startTime and endTime are required.");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("Hourly booking startTime must be before endTime.");
        }

        LocalDateTime requestedStart = LocalDateTime.of(request.getProposedStart(), request.getStartTime());
        LocalDateTime requestedEnd = LocalDateTime.of(request.getProposedEnd(), request.getEndTime());
        LocalDateTime now = LocalDateTime.now();
        if (requestedStart.isBefore(now) || !requestedEnd.isAfter(now)) {
            throw new IllegalArgumentException("Hourly bookings cannot be in the past.");
        }

        LocalTime openingTime = parsePropertyTime(property.getOpeningTime(), "opening time");
        LocalTime closingTime = parsePropertyTime(property.getClosingTime(), "closing time");
        if (!openingTime.isBefore(closingTime)) {
            throw new IllegalArgumentException("Property business hours are invalid.");
        }
        if (request.getStartTime().isBefore(openingTime) || request.getEndTime().isAfter(closingTime)) {
            throw new IllegalArgumentException("Hourly booking must be within the property's business hours.");
        }

        Integer slotDurationMinutes = property.getSlotDurationMinutes();
        if (slotDurationMinutes == null || slotDurationMinutes <= 0) {
            throw new IllegalArgumentException("Property slot duration is not configured.");
        }

        long startOffset = Duration.between(openingTime, request.getStartTime()).toMinutes();
        long duration = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        if (startOffset % slotDurationMinutes != 0
                || duration <= 0
                || duration % slotDurationMinutes != 0) {
            throw new IllegalArgumentException("Hourly booking must align with the configured slot duration.");
        }

        if (request.getTeamSize() == null || request.getTeamSize() <= 0) {
            throw new IllegalArgumentException("Team size must be at least 1.");
        }
        if (property.getCapacity() == null || property.getCapacity() <= 0) {
            throw new IllegalArgumentException("Property capacity is not configured.");
        }
        if (request.getTeamSize() > property.getCapacity()) {
            throw new IllegalArgumentException("Team size cannot exceed the property's capacity.");
        }

        if (property.getOwnerId() != null && property.getOwnerId().equals(request.getUserId())) {
            throw new IllegalArgumentException("Property owners cannot book their own property.");
        }
    }

    private LocalTime parsePropertyTime(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Property " + label + " is not configured.");
        }
        try {
            return BookingDateUtils.parseTime(value);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException("Property " + label + " is invalid.", e);
        }
    }

    public boolean isHoldExpired(PropertyRequest request) {
        if (request == null) return true;
        if (request.getStatus() != BookingStatus.PENDING_PAYMENT) return false;
        if (request.getCreatedAt() == null) return true;
        return request.getCreatedAt().isBefore(getCutoffTime());
    }

    public boolean isCancellable(PropertyRequest request, Property property) {
        if (request == null) return false;
        BookingStatus status = request.getStatus();
        if (status == BookingStatus.CANCELLED || status == BookingStatus.EXPIRED || status == BookingStatus.REJECTED) {
            return false;
        }

        // Allow cancellation if current date/time is prior to booking start
        LocalDate proposedStart = request.getProposedStart();
        if (proposedStart == null) return true;

        if (property != null && "OFFICE".equalsIgnoreCase(property.getPropertyType()) && "HOUR".equalsIgnoreCase(property.getPriceUnit())) {
            if (request.getStartTime() == null) {
                return false;
            }
            return !BookingDateUtils.isPastDateTime(proposedStart, request.getStartTime().toString());
        }

        return !proposedStart.isBefore(LocalDate.now());
    }

}
