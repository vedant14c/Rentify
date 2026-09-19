package com.officespace.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.officespace.dtos.BookedDateRangeDTO;
import com.officespace.dtos.OwnerRequestView;
import com.officespace.entities.PropertyRequest;
import com.officespace.entities.RequestType;
import com.officespace.services.PropertyRequestServiceImpl;

@RestController
@RequestMapping("/requests")
public class PropertyRequestController {

	private final PropertyRequestServiceImpl propertyRequestService;

	public PropertyRequestController(PropertyRequestServiceImpl propertyRequestService) {
		this.propertyRequestService = propertyRequestService;
	}

	@GetMapping("/availability")
	public List<BookedDateRangeDTO> getAvailability(@RequestParam int propertyId) {
		return propertyRequestService.getAvailability(propertyId);
	}

	@PostMapping
	public PropertyRequest addRequest(@RequestBody PropertyRequest request) {
		try {
			
		    System.out.println("===== ADD REQUEST CONTROLLER =====");
			return propertyRequestService.addRequest(request);
		} catch (IllegalStateException e) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, e.getMessage());
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
		}
	}

	@GetMapping
	public List<PropertyRequest> getAllRequests(@RequestParam(required = false) RequestType type) {
		return propertyRequestService.getAllRequests(type);
	}

	@GetMapping("/{id}")
	public PropertyRequest getRequestById(@PathVariable int id) {
		return propertyRequestService.getRequestById(id);
	}

	@GetMapping("/my/{userId}")
	public List<PropertyRequest> getRequestsByUser(@PathVariable int userId,
			@RequestParam(required = false) RequestType type) {
		return propertyRequestService.getRequestsByUser(userId, type);
	}

	@GetMapping("/property/{propertyId}")
	public List<PropertyRequest> getRequestsByProperty(@PathVariable int propertyId,
			@RequestParam(required = false) RequestType type) {
		return propertyRequestService.getRequestsByProperty(propertyId, type);
	}

	@PutMapping("/status/{id}")
	public PropertyRequest updateStatus(@PathVariable int id, @RequestParam String status) {
		return propertyRequestService.updateStatus(id, status);
	}

	@PutMapping("/cancel/{id}")
	public PropertyRequest cancelRequest(@PathVariable int id) {
		return propertyRequestService.cancelRequest(id);
	}

	@GetMapping("/owner/{ownerId}")
	public List<OwnerRequestView> getRequestsByOwner(@PathVariable int ownerId) {
		return propertyRequestService.getRequestsByOwner(ownerId);
	}
}
