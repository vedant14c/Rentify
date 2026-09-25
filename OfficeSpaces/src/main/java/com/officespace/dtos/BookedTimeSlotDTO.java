package com.officespace.dtos;

import java.time.LocalDate;
import com.officespace.entities.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookedTimeSlotDTO {
    private LocalDate date;
    private String startTime;
    private String endTime;
    private BookingStatus status;

}
