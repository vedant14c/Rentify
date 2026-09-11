package com.officespace.dtos;

import java.time.LocalDate;
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
}
