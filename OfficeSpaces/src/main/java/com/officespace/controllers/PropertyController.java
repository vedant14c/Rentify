package com.officespace.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.officespace.dtos.ApiResponse;
import com.officespace.dtos.PropertyAvailabilityDTO;
import com.officespace.entities.Property;
import com.officespace.services.PropertyAvailabilityService;
import com.officespace.services.PropertyImageServiceImpl;
import com.officespace.services.PropertyServiceImpl;

@RestController
@RequestMapping("/properties")
public class PropertyController {

	private final PropertyImageServiceImpl propertyImageServiceImpl;

	@Autowired
	private PropertyServiceImpl propertyService;

	@Autowired
	private PropertyAvailabilityService availabilityService;

	PropertyController(PropertyImageServiceImpl propertyImageServiceImpl) {
		this.propertyImageServiceImpl = propertyImageServiceImpl;
	}

	@GetMapping("/{id}/availability")
	public ApiResponse<PropertyAvailabilityDTO> getPropertyAvailability(@PathVariable int id) {
		PropertyAvailabilityDTO dto = availabilityService.getPropertyAvailability(id);
		return ApiResponse.success("Property availability loaded successfully", dto);
	}

	// tenant / user
	@GetMapping
	public List<Property> getAllProperties() {
		List<Property> list = propertyService.getAllProperties();
		System.out.println("=== [BACKEND LOG] GET /properties called. Count: " + list.size() + " ===");
		return list;
	}

	@GetMapping("/{id}")
	public Property getPropertyById(@PathVariable int id) {
		return propertyService.getPropertyById(id);
	}

	// owner
	@PostMapping
	public Property addProperty(@RequestBody Property property) {
		System.out.println("ADD PROPERTY HIT");
		return propertyService.addProperty(property);
	}

	@PutMapping("/{id}")
	public Property updateProperty(@PathVariable int id, @RequestBody Property property) {
		return propertyService.updateProperty(id, property);
	}

	@DeleteMapping("/{id}")
	public String deleteProperty(@PathVariable int id) {
		return propertyService.deleteProperty(id);
	}

	@GetMapping("/owner/{ownerId}")
	public List<Property> getPropertiesByOwnerId(@PathVariable Integer ownerId) {
		return propertyService.getPropertiesByOwnerId(ownerId);
	}

	@GetMapping("/approved")
	public List<Property> getApprovedProperties() {
		return propertyService.getApprovedProperties();
	}

	@PutMapping("/approve/{id}")
	public Property approveProperty(@PathVariable int id) {
		return propertyService.setApproval(id, true);
	}

	@PutMapping("/reject/{id}")
	public Property rejectProperty(@PathVariable int id) {
		return propertyService.setApproval(id, false);
	}
}
