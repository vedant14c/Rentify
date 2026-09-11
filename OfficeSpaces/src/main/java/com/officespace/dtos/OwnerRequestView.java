package com.officespace.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class OwnerRequestView {
    private Integer requestId;
    private Integer propertyId;
    private String propertyTitle;
    private Integer userId;
    private String requesterName;
    private String requestType;
    private BigDecimal offerPrice;
    private LocalDate proposedStart;
    private LocalDate proposedEnd;
    private String status;
    private LocalDateTime createdAt;
    private String bookingMode;

    public OwnerRequestView(Integer requestId, Integer propertyId, String propertyTitle,
            Integer userId, String requesterName, String requestType, BigDecimal offerPrice,
            LocalDate proposedStart, LocalDate proposedEnd, String status, LocalDateTime createdAt) {
        this(requestId, propertyId, propertyTitle, userId, requesterName, requestType, offerPrice,
             proposedStart, proposedEnd, status, createdAt, "INSTANT");
    }

    public OwnerRequestView(Integer requestId, Integer propertyId, String propertyTitle,
            Integer userId, String requesterName, String requestType, BigDecimal offerPrice,
            LocalDate proposedStart, LocalDate proposedEnd, String status, LocalDateTime createdAt,
            String bookingMode) {
        this.requestId = requestId;
        this.propertyId = propertyId;
        this.propertyTitle = propertyTitle;
        this.userId = userId;
        this.requesterName = requesterName;
        this.requestType = requestType;
        this.offerPrice = offerPrice;
        this.proposedStart = proposedStart;
        this.proposedEnd = proposedEnd;
        this.status = status;
        this.createdAt = createdAt;
        this.bookingMode = bookingMode != null ? bookingMode : "INSTANT";
    }

    // getters (required for Jackson serialization — no Lombok here since this is a JPQL constructor-expression target)
    public Integer getRequestId() { return requestId; }
    public Integer getPropertyId() { return propertyId; }
    public String getPropertyTitle() { return propertyTitle; }
    public Integer getUserId() { return userId; }
    public String getRequesterName() { return requesterName; }
    public String getRequestType() { return requestType; }
    public BigDecimal getOfferPrice() { return offerPrice; }
    public LocalDate getProposedStart() { return proposedStart; }
    public LocalDate getProposedEnd() { return proposedEnd; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getBookingMode() { return bookingMode; }
}