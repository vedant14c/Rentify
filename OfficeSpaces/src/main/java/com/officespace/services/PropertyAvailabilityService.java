package com.officespace.services;

import com.officespace.daos.PropertyDao;
import com.officespace.daos.PropertyRequestDao;
import com.officespace.dtos.BookedDateRangeDTO;
import com.officespace.dtos.PropertyAvailabilityDTO;
import com.officespace.entities.BookingStatus;
import com.officespace.entities.Property;
import com.officespace.entities.PropertyRequest;
import com.officespace.mappers.BookingMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertyAvailabilityService {

    @Autowired
    private PropertyDao propertyDao;

    @Autowired
    private PropertyRequestDao requestDao;

    @Autowired
    private BookingValidationService validationService;

    @Autowired
    private BookingMapper bookingMapper;

    @Value("${booking.payment.hold-minutes:15}")
    private long holdMinutes;

    @Transactional(readOnly = true)
    public PropertyAvailabilityDTO getPropertyAvailability(Integer propertyId) {
        Property property = propertyDao.findById(propertyId)
                .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + propertyId));

        LocalDateTime cutoffTime = validationService.getCutoffTime();
        List<BookingStatus> activeStatuses = validationService.getActiveStatuses();

        List<BookedDateRangeDTO> bookedDateRanges = requestDao.findActiveBookingsByPropertyId(
                propertyId, activeStatuses, BookingStatus.PENDING_PAYMENT, cutoffTime
        );

        List<PropertyRequest> activeRequests = requestDao.findActivePropertyRequestsByPropertyId(
                propertyId, activeStatuses, BookingStatus.PENDING_PAYMENT, cutoffTime
        );

        LocalDate nextAvailableDate = calculateNextAvailableDate(activeRequests);

        YearMonth currentMonth = YearMonth.now();
        long monthlyBookingsCount = requestDao.countConfirmedBookingsInMonth(
                propertyId,
                BookingStatus.CONFIRMED,
                currentMonth.atDay(1),
                currentMonth.atEndOfMonth()
        );

        return bookingMapper.toAvailabilityDTO(
                property,
                bookedDateRanges,
                nextAvailableDate,
                monthlyBookingsCount,
                holdMinutes
        );
    }

    private LocalDate calculateNextAvailableDate(List<PropertyRequest> activeRequests) {
        LocalDate today = LocalDate.now();
        if (activeRequests == null || activeRequests.isEmpty()) {
            return today;
        }

        LocalDate currentEndChain = today;
        boolean isOccupiedToday = false;

        for (PropertyRequest request : activeRequests) {
            LocalDate start = request.getProposedStart();
            LocalDate end = request.getProposedEnd();

            if (start == null || end == null) continue;

            if (!today.isBefore(start) && today.isBefore(end)) {
                isOccupiedToday = true;
                if (end.isAfter(currentEndChain)) {
                    currentEndChain = end;
                }
            } else if (isOccupiedToday && !start.isAfter(currentEndChain)) {
                if (end.isAfter(currentEndChain)) {
                    currentEndChain = end;
                }
            }
        }

        return isOccupiedToday ? currentEndChain : today;
    }
}
