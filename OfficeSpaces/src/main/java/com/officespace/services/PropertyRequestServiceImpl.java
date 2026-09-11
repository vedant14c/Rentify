package com.officespace.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.officespace.daos.NotificationDao;
import com.officespace.daos.PropertyDao;
import com.officespace.daos.PropertyRequestDao;
import com.officespace.daos.UserDao;
import com.officespace.dtos.BookedDateRangeDTO;
import com.officespace.dtos.OwnerRequestView;
import com.officespace.entities.BookingMode;
import com.officespace.entities.BookingStatus;
import com.officespace.entities.Notification;
import com.officespace.entities.NotificationType;
import com.officespace.entities.Property;
import com.officespace.entities.PropertyRequest;
import com.officespace.entities.RequestType;
import com.officespace.entities.User;
import com.officespace.utils.BookingDateUtils;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class PropertyRequestServiceImpl {

	private final UserDao userDao;
	private final PropertyRequestDao propertyRequestDao;
	private final PropertyDao propertyDao;
	private final NotificationDao notificationDao;
	private final BookingValidationService validationService;
	private final NotificationServiceImpl notificationServiceImpl;
	
	public PropertyRequestServiceImpl(UserDao userDao,
	                                   PropertyRequestDao propertyRequestDao,
	                                   PropertyDao propertyDao,
	                                   NotificationDao notificationDao,
	                                   BookingValidationService validationService,
	                                   NotificationServiceImpl notificationServiceImpl) {
		this.userDao = userDao;
		this.propertyRequestDao = propertyRequestDao;
		this.propertyDao = propertyDao;
		this.notificationDao = notificationDao;
		this.validationService = validationService;
		this.notificationServiceImpl = notificationServiceImpl;
	}

	public List<BookedDateRangeDTO> getAvailability(Integer propertyId) {
		return propertyRequestDao.findActiveBookingsByPropertyId(
				propertyId,
				validationService.getActiveStatuses(),
				BookingStatus.PENDING_PAYMENT,
				validationService.getCutoffTime()
		);
	}

	public List<OwnerRequestView> getRequestsByOwner(Integer ownerId) {
		return propertyRequestDao.findOwnerRequestViews(ownerId);
	}

	public PropertyRequest addRequest(PropertyRequest request) {
		validateTypeSpecificFields(request);

		if (request.getUserId() == null || request.getUserId() <= 0) {
			throw new IllegalArgumentException("Invalid user ID provided.");
		}

		if (!userDao.existsById(request.getUserId())) {
			throw new IllegalArgumentException("User not found with ID: " + request.getUserId());
		}

		// CRITICAL RACE CONDITION GUARD: acquire row-level lock on Property with fallback
		Property property = propertyDao.findWithLockByPropertyId(request.getPropertyId())
				.orElseGet(() -> propertyDao.findById(request.getPropertyId())
						.orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + request.getPropertyId())));

		// Server-side availability re-check inside the locked transaction
		if (validationService.hasOverlap(request.getPropertyId(), request.getProposedStart(), request.getProposedEnd())) {
			throw new IllegalStateException("The selected dates are no longer available for booking.");
		}

		BookingMode bookingMode = property.getBookingMode() != null ? property.getBookingMode() : BookingMode.INSTANT;

		request.setRequestId(null);
		if (bookingMode == BookingMode.INSTANT) {
			request.setStatus(BookingStatus.PENDING_PAYMENT);
		} else {
			request.setStatus(BookingStatus.PENDING);
		}
		request.setReviewedBy(null);
		request.setReviewedAt(null);
		request.setCreatedAt(LocalDateTime.now());

		request.setCreatedAt(LocalDateTime.now());

		// ✅ SAVE FIRST
		PropertyRequest savedRequest = propertyRequestDao.save(request);

		// ✅ SEND NOTIFICATION TO OWNER
		Property savedProperty = propertyDao.findById(savedRequest.getPropertyId()).orElse(null);
		if (property != null) {
		    User owner = userDao.findById(property.getOwnerId()).orElse(null);

		    if (owner != null && owner.getFcmToken() != null) {

		        notificationServiceImpl.sendPushNotification(
		                owner.getFcmToken(),
		                "New Booking Request",
		                "You received a new booking request",
		                "BOOKING",
		                String.valueOf(savedRequest.getRequestId())
		        );
		    }
		}

	
		return savedRequest;
	}

	public List<PropertyRequest> getAllRequests(RequestType type) {
		return type == null ? propertyRequestDao.findAll() : propertyRequestDao.findByRequestType(type);
	}

	public PropertyRequest getRequestById(int id) {
		return propertyRequestDao.findById(id).orElse(null);
	}

	public List<PropertyRequest> getRequestsByUser(int userId, RequestType type) {
		try {
			List<PropertyRequest> requests = type == null ? propertyRequestDao.findByUserId(userId)
					: propertyRequestDao.findByUserIdAndRequestType(userId, type);
			return requests != null ? requests : List.of();
		} catch (Exception e) {
			System.err.println("Error fetching requests for userId " + userId + ": " + e.getMessage());
			e.printStackTrace();
			return List.of();
		}
	}

	public List<PropertyRequest> getRequestsByProperty(int propertyId, RequestType type) {
		return type == null ? propertyRequestDao.findByPropertyId(propertyId)
				: propertyRequestDao.findByPropertyIdAndRequestType(propertyId, type);
	}

	public PropertyRequest updateStatus(int id, String statusStr) {
		PropertyRequest request = propertyRequestDao.findById(id).orElse(null);
		if (request == null) {
			return null;
		}

		BookingStatus newStatus;
		try {
			newStatus = BookingStatus.valueOf(statusStr.toUpperCase());
		} catch (Exception e) {
			if ("accepted".equalsIgnoreCase(statusStr)) {
				newStatus = BookingStatus.APPROVED;
			} else {
				newStatus = BookingStatus.PENDING;
			}
		}

		request.setStatus(newStatus);

		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication != null) {
			User reviewer = userDao.findByEmail(authentication.getName());
			if (reviewer != null) {
				request.setReviewedBy(reviewer.getId());
			}
		}

		request.setReviewedAt(LocalDateTime.now());
		PropertyRequest updatedRequest = propertyRequestDao.save(request);

		Notification notification = new Notification();
		notification.setUserId(updatedRequest.getUserId());
		notification.setRequestId(updatedRequest.getRequestId());
		notification.setTitle("Request " + newStatus.name().toLowerCase());
		notification.setMessage("Your " + updatedRequest.getRequestType() + " request has been updated to " + newStatus.name() + ".");
		notification.setType(NotificationType.RENTAL);
		notification.setIsRead(false);
		notification.setCreatedAt(LocalDateTime.now());
		notificationDao.save(notification);

		User user = userDao.findById(updatedRequest.getUserId()).orElse(null);

		if (user != null && user.getFcmToken() != null) {

		    notificationServiceImpl.sendPushNotification(
		            user.getFcmToken(),
		            "Request " + newStatus.name(),
		            "Your request has been " + newStatus.name().toLowerCase(),
		            "BOOKING",
		            String.valueOf(updatedRequest.getRequestId())
		    );
		}
		return updatedRequest;
	}

	public PropertyRequest cancelRequest(int id) {
		PropertyRequest request = propertyRequestDao.findById(id).orElse(null);
		if (request == null) {
			return null;
		}

		Property property = propertyDao.findById(request.getPropertyId()).orElse(null);
		if (!validationService.isCancellable(request, property)) {
			throw new IllegalStateException("This booking cannot be cancelled because it has already started or expired.");
		}

		request.setStatus(BookingStatus.CANCELLED);
		return propertyRequestDao.save(request);
	}

	private void validateTypeSpecificFields(PropertyRequest request) {
		request.setRequestType(RequestType.RENTAL);

		if (request.getProposedStart() == null || request.getProposedEnd() == null) {
			throw new IllegalArgumentException("proposedStart and proposedEnd are required for a rental request");
		}
		if (request.getProposedEnd().isBefore(request.getProposedStart())) {
			throw new IllegalArgumentException("proposedEnd cannot be before proposedStart");
		}
	}

	public double calculateTotal(double basePrice, String priceUnit, LocalDate start, LocalDate end, String startTime, String endTime) {
        String unit = priceUnit != null ? priceUnit.toUpperCase() : "MONTH";

        switch (unit) {
            case "HOUR":
                long hours = BookingDateUtils.calculateHours(startTime, endTime);
                return basePrice * hours;
            case "DAY":
                long days = BookingDateUtils.calculateDays(start, end);
                return basePrice * days;
            case "WEEK":
                long weeks = BookingDateUtils.calculateWeeks(start, end);
                return basePrice * weeks;
            case "MONTH":
            default:
                long months = BookingDateUtils.calculateMonths(start, end);
                return basePrice * months;
        }
    }

    public String calculateDuration(String priceUnit, LocalDate start, LocalDate end, String startTime, String endTime) {
        String unit = priceUnit != null ? priceUnit.toUpperCase() : "MONTH";

        switch (unit) {
            case "HOUR":
                long hours = BookingDateUtils.calculateHours(startTime, endTime);
                return hours + (hours == 1 ? " Hour" : " Hours");
            case "DAY":
                long days = BookingDateUtils.calculateDays(start, end);
                return days + (days == 1 ? " Day" : " Days");
            case "WEEK":
                long weeks = BookingDateUtils.calculateWeeks(start, end);
                return weeks + (weeks == 1 ? " Week" : " Weeks");
            case "MONTH":
            default:
                long months = BookingDateUtils.calculateMonths(start, end);
                return months + (months == 1 ? " Month" : " Months");
        }
    }
}
