package com.officespace.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.officespace.daos.PropertyDao;
import com.officespace.daos.UserDao;
import com.officespace.entities.Property;
import com.officespace.entities.BookingMode;
import com.officespace.entities.Role;
import com.officespace.entities.User;
import com.officespace.security.AuthenticatedUserService;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class PropertyServiceImpl {

	private static final java.util.Set<String> SUPPORTED_PROPERTY_TYPES =
			java.util.Set.of("Office", "House", "Apartment", "Villa");

	private final UserDao userDao;
	private final AuthenticatedUserService authenticatedUserService;

	@Autowired
	private PropertyDao propertyDao;

	// renter / tenant
	PropertyServiceImpl(UserDao userDao, AuthenticatedUserService authenticatedUserService) {
		this.userDao = userDao;
		this.authenticatedUserService = authenticatedUserService;
	}

	public List<Property> getAllProperties() {
		return propertyDao.findAll();
	}

	public Property getPropertyById(int id) {
		return propertyDao.findById(id).orElse(null);
	}

//owner
	public Property addProperty(Property property) {
		validateNewProperty(property);
		if (property.getBookingMode() == null) {
			property.setBookingMode(isResidential(property) ? BookingMode.REQUEST : BookingMode.INSTANT);
		}
		validateBookingMode(property);
		if (isResidential(property) && (property.getPriceUnit() == null
				|| property.getPriceUnit().isBlank())) {
			property.setPriceUnit("MONTH");
		}
	    User authenticatedUser = authenticatedUserService.requireOwnerOrAdmin();
	    if (authenticatedUser.getRole() == com.officespace.entities.Role.OWNER) {
	        property.setOwnerId(authenticatedUser.getId());
	    }

	    if (property.getListingType() == null || property.getListingType().isBlank()) {
	        property.setListingType("RENT");
	    }

	    property.setIsApproved(false);
	    property.setApprovalStatus("PENDING");

	    property.setCreatedAt(LocalDateTime.now());
	    property.setUpdatedAt(LocalDateTime.now());

	    return propertyDao.save(property);
	}

//Owner edits an existing listing
	public Property updateProperty(int id, Property updatedProperty) {

	    Property property = propertyDao.findById(id).orElse(null);

	    if (property != null) {
	    	if (updatedProperty == null) {
	    		throw new IllegalArgumentException("Property details are required.");
	    	}
	    	validateUpdatedPropertyType(property, updatedProperty);
	    	if (updatedProperty.getBookingMode() == null) {
	    		updatedProperty.setBookingMode(property.getBookingMode());
	    	}
	    	validateBookingMode(updatedProperty);
	        User authenticatedUser = authenticatedUserService.requireOwnerOrAdmin();
	        if (authenticatedUser.getRole() != com.officespace.entities.Role.ADMIN
	                && !authenticatedUser.getId().equals(property.getOwnerId())) {
	            throw new org.springframework.security.access.AccessDeniedException(
	                    "You can only edit properties that you own.");
	        }

	        property.setUpdatedAt(LocalDateTime.now());

	        BeanUtils.copyProperties(
	                updatedProperty,
	                property,
	                "propertyId",
	                "ownerId",
	                "createdAt",
	                "approvalStatus",
	                "isApproved");

	        if (property.getListingType() == null || property.getListingType().isBlank()) {
	            property.setListingType("RENT");
	        }

	        return propertyDao.save(property);
	    }

	    return null;
	}

	private void validateNewProperty(Property property) {
		if (property == null || property.getPropertyType() == null
				|| !SUPPORTED_PROPERTY_TYPES.contains(property.getPropertyType())) {
			throw new IllegalArgumentException(
					"Property type is required and must be Office, House, Apartment, or Villa.");
		}
	}

	private void validateUpdatedPropertyType(Property existingProperty, Property updatedProperty) {
		String requestedType = updatedProperty == null ? null : updatedProperty.getPropertyType();
		if (requestedType == null || requestedType.isBlank()) {
			updatedProperty.setPropertyType(existingProperty.getPropertyType());
			return;
		}
		if (!SUPPORTED_PROPERTY_TYPES.contains(requestedType)
				&& !requestedType.equals(existingProperty.getPropertyType())) {
			throw new IllegalArgumentException(
					"Property type must be Office, House, Apartment, or Villa.");
		}
	}

	private boolean isResidential(Property property) {
		return property != null && property.getPropertyType() != null
				&& isResidentialType(property.getPropertyType());
	}

	private boolean isResidentialType(String propertyType) {
		return "House".equalsIgnoreCase(propertyType)
				|| "Apartment".equalsIgnoreCase(propertyType)
				|| "Villa".equalsIgnoreCase(propertyType);
	}

	private void validateBookingMode(Property property) {
		BookingMode bookingMode = property.getBookingMode();
		if (bookingMode == null || (bookingMode != BookingMode.INSTANT
				&& bookingMode != BookingMode.instant
				&& bookingMode != BookingMode.REQUEST
				&& bookingMode != BookingMode.request
				&& bookingMode != BookingMode.APPROVAL
				&& bookingMode != BookingMode.approval
				&& bookingMode != BookingMode.OWNER_APPROVAL
				&& bookingMode != BookingMode.owner_approval)) {
			throw new IllegalArgumentException("Booking mode must be INSTANT or REQUEST.");
		}
		if (isResidential(property)
				&& (bookingMode == BookingMode.INSTANT || bookingMode == BookingMode.instant)) {
			throw new IllegalArgumentException(
					"Residential properties must use REQUEST booking mode.");
		}
	}

	public String deleteProperty(int id) {

		propertyDao.deleteById(id);

		return "Property deleted successfully";
	}

	public List<Property> getPropertiesByOwnerId(Integer ownerId) {
		User authenticatedUser = authenticatedUserService.requireOwnerOrAdmin();
		Integer requestedOwnerId = authenticatedUser.getRole() == Role.ADMIN
				? ownerId
				: authenticatedUser.getId();
		return propertyDao.findByOwnerId(requestedOwnerId);
	}

	public List<Property> getApprovedProperties() {
	    return propertyDao.findAll().stream()
	            .filter(p -> Boolean.TRUE.equals(p.getIsApproved()) || "APPROVED".equalsIgnoreCase(p.getApprovalStatus()))
	            .toList();
	}

	public Property setApproval(int id, boolean approved) {

	    Property property = propertyDao.findById(id).orElse(null);

	    if (property == null) {
	        return null;
	    }

	    property.setIsApproved(approved);

	    if (approved) {
	        property.setApprovalStatus("APPROVED");
	        property.setStatus("AVAILABLE");
	    } else {
	        property.setApprovalStatus("REJECTED");
	        property.setStatus("REJECTED");
	    }

	    property.setUpdatedAt(LocalDateTime.now());

	    return propertyDao.save(property);
	}
	
}
