package com.officespace.services;

import com.officespace.daos.PropertyRequestDao;
import com.officespace.entities.BookingStatus;
import com.officespace.entities.Property;
import com.officespace.entities.PropertyRequest;
import com.officespace.utils.BookingDateUtils;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
            // For hourly bookings, parse start time from message if present
            String startTimeStr = extractStartTimeFromMessage(request.getMessage());
            return !BookingDateUtils.isPastDateTime(proposedStart, startTimeStr);
        }

        return !proposedStart.isBefore(LocalDate.now());
    }

    private String extractStartTimeFromMessage(String message) {
        if (message == null) return null;
        if (message.contains("Hours:")) {
            try {
                String hoursPart = message.split("Hours:")[1].split("\\|")[0].trim();
                return hoursPart.split("-")[0].trim();
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
