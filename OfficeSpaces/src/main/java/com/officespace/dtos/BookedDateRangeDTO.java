package com.officespace.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.officespace.entities.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookedDateRangeDTO {

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate proposedStart;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate proposedEnd;

    private BookingStatus status;

    
    public BookedDateRangeDTO(LocalDate proposedStart, LocalDate proposedEnd) {
        this.proposedStart = proposedStart;
        this.proposedEnd = proposedEnd;
        this.status = BookingStatus.CONFIRMED;
    }
}