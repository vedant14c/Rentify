package com.officespace.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingSummaryDTO {
    private Integer requestId;
    private Integer propertyId;
    private Integer userId;
    private String propertyName;
    private String propertyImage;
    private String propertyType;
    private String city;
    private String status;
    private String bookingMode;
    private LocalDate proposedStart;
    private LocalDate proposedEnd;
    private BigDecimal offerPrice;
    private String message;
    private LocalDateTime createdAt;
}
