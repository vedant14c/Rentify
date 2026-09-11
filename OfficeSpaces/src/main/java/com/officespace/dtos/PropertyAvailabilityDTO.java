package com.officespace.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyAvailabilityDTO {
    private String bookingMode;
    private String priceUnit;
    private String openingTime;
    private String closingTime;
    private Integer slotDurationMinutes;
    private List<BookedDateRangeDTO> bookedDateRanges;
    private List<BookedTimeSlotDTO> bookedTimeSlots;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate nextAvailableDate;

    private long monthlyBookingsCount;
    private long holdMinutes;
}
