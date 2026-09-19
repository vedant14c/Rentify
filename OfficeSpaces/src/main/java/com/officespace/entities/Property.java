package com.officespace.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "properties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Property {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer propertyId;

	@Column(nullable = false)
	private Integer ownerId;

	@Column(nullable = false)
	private String title;

	private String description;

	@Column(nullable = false)
	private String propertyType;

	@Column(nullable = false)
	private String listingType;

	@Column(nullable = false)
	private Double price;

	private String priceUnit;

	private Double areaSqft;

	private Integer floorNumber;

	private Integer totalFloors;

	private String address;

	@Column(nullable = false)
	private String city;

	@Column(nullable = false)
	private String state;

	private String zipCode;

	private Double latitude;

	private Double longitude;

	private String status;

	private Boolean isApproved;
	@Column(name = "approval_status")
	private String approvalStatus;

	@jakarta.persistence.Convert(converter = com.officespace.converters.BookingModeConverter.class)
	@Column(name = "booking_mode")
	private BookingMode bookingMode = BookingMode.INSTANT;

	@Column(name = "opening_time")
	private String openingTime;

	@Column(name = "closing_time")
	private String closingTime;

	@Column(name = "slot_duration_minutes")
	private Integer slotDurationMinutes;

	private LocalDateTime createdAt;

	private LocalDateTime updatedAt;

	@PrePersist
	void applyDefaults() {
		if (bookingMode == null) {
			bookingMode = BookingMode.INSTANT;
		}
	}
}