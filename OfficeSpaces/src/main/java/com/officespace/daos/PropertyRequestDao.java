package com.officespace.daos;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.officespace.dtos.BookedDateRangeDTO;
import com.officespace.dtos.OwnerRequestView;
import com.officespace.entities.BookingStatus;
import com.officespace.entities.PropertyRequest;
import com.officespace.entities.RequestType;

public interface PropertyRequestDao extends JpaRepository<PropertyRequest, Integer> {

    List<PropertyRequest> findByUserId(Integer userId);

    List<PropertyRequest> findByPropertyId(Integer propertyId);

    List<PropertyRequest> findByRequestType(RequestType requestType);

    List<PropertyRequest> findByUserIdAndRequestType(Integer userId, RequestType requestType);

    List<PropertyRequest> findByPropertyIdAndRequestType(Integer propertyId, RequestType requestType);

    @Query("SELECT new com.officespace.dtos.BookedDateRangeDTO(pr.proposedStart, pr.proposedEnd, pr.status) "
         + "FROM PropertyRequest pr "
         + "WHERE pr.propertyId = :propertyId "
         + "AND (pr.status IN :activeStatuses OR (pr.status = :pendingPaymentStatus AND pr.createdAt >= :cutoffTime)) "
         + "AND pr.proposedStart IS NOT NULL AND pr.proposedEnd IS NOT NULL "
         + "ORDER BY pr.proposedStart ASC")
    List<BookedDateRangeDTO> findActiveBookingsByPropertyId(
            @Param("propertyId") Integer propertyId,
            @Param("activeStatuses") List<BookingStatus> activeStatuses,
            @Param("pendingPaymentStatus") BookingStatus pendingPaymentStatus,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT pr FROM PropertyRequest pr "
         + "WHERE pr.propertyId = :propertyId "
         + "AND (pr.status IN :activeStatuses OR (pr.status = :pendingPaymentStatus AND pr.createdAt >= :cutoffTime)) "
         + "AND pr.proposedStart IS NOT NULL AND pr.proposedEnd IS NOT NULL "
         + "ORDER BY pr.proposedStart ASC")
    List<PropertyRequest> findActivePropertyRequestsByPropertyId(
            @Param("propertyId") Integer propertyId,
            @Param("activeStatuses") List<BookingStatus> activeStatuses,
            @Param("pendingPaymentStatus") BookingStatus pendingPaymentStatus,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT COUNT(pr) FROM PropertyRequest pr "
         + "WHERE pr.propertyId = :propertyId "
         + "AND (pr.status IN :activeStatuses OR (pr.status = :pendingPaymentStatus AND pr.createdAt >= :cutoffTime)) "
         + "AND pr.proposedStart < :proposedEnd "
         + "AND pr.proposedEnd > :proposedStart")
    long countOverlappingBookings(
            @Param("propertyId") Integer propertyId,
            @Param("proposedStart") LocalDate proposedStart,
            @Param("proposedEnd") LocalDate proposedEnd,
            @Param("activeStatuses") List<BookingStatus> activeStatuses,
            @Param("pendingPaymentStatus") BookingStatus pendingPaymentStatus,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT COUNT(pr) FROM PropertyRequest pr "
         + "WHERE pr.propertyId = :propertyId "
         + "AND pr.requestId <> :requestId "
         + "AND (pr.status IN :activeStatuses OR (pr.status = :pendingPaymentStatus AND pr.createdAt >= :cutoffTime)) "
         + "AND pr.proposedStart < :proposedEnd "
         + "AND pr.proposedEnd > :proposedStart")
    long countOverlappingBookingsExcludingRequest(
            @Param("propertyId") Integer propertyId,
            @Param("requestId") Integer requestId,
            @Param("proposedStart") LocalDate proposedStart,
            @Param("proposedEnd") LocalDate proposedEnd,
            @Param("activeStatuses") List<BookingStatus> activeStatuses,
            @Param("pendingPaymentStatus") BookingStatus pendingPaymentStatus,
            @Param("cutoffTime") LocalDateTime cutoffTime);

    @Query("SELECT COUNT(pr) FROM PropertyRequest pr "
         + "WHERE pr.propertyId = :propertyId "
         + "AND pr.status = :confirmedStatus "
         + "AND pr.proposedStart >= :monthStart AND pr.proposedStart <= :monthEnd")
    long countConfirmedBookingsInMonth(
            @Param("propertyId") Integer propertyId,
            @Param("confirmedStatus") BookingStatus confirmedStatus,
            @Param("monthStart") LocalDate monthStart,
            @Param("monthEnd") LocalDate monthEnd);

    @Query("SELECT new com.officespace.dtos.OwnerRequestView(pr.requestId, pr.propertyId, p.title, "
         + "pr.userId, u.name, CAST(pr.requestType AS string), pr.offerPrice, pr.proposedStart, "
         + "pr.proposedEnd, CAST(pr.status AS string), pr.createdAt, CAST(p.bookingMode AS string)) "
         + "FROM PropertyRequest pr, Property p, User u "
         + "WHERE pr.propertyId = p.propertyId AND pr.userId = u.id AND p.ownerId = :ownerId "
         + "ORDER BY pr.createdAt DESC")
    List<OwnerRequestView> findOwnerRequestViews(@Param("ownerId") Integer ownerId);
}
