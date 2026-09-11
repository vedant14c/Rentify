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
import com.officespace.entities.User;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class PropertyServiceImpl {

	private final UserDao userDao;

	@Autowired
	private PropertyDao propertyDao;

	// renter / tenant
	PropertyServiceImpl(UserDao userDao) {
		this.userDao = userDao;
	}

	public List<Property> getAllProperties() {
		return propertyDao.findAll();
	}

	public Property getPropertyById(int id) {
		return propertyDao.findById(id).orElse(null);
	}

//owner
	public Property addProperty(Property property) {
	    try {
	        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
	        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(authentication.getName())) {
	            User user = userDao.findByEmail(authentication.getName());
	            if (user != null) {
	                property.setOwnerId(user.getId());
	            }
	        }
	    } catch (Exception e) {
	        // Keep ownerId from request body if security context user is unavailable
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

	public String deleteProperty(int id) {

		propertyDao.deleteById(id);

		return "Property deleted successfully";
	}

	public List<Property> getPropertiesByOwnerId(Integer ownerId) {
		return propertyDao.findByOwnerId(ownerId);
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
