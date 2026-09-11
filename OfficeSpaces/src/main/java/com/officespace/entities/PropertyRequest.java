package com.officespace.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
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
@Table(name = "property_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer requestId;

	@Column(nullable = false)
	private Integer propertyId;

	@Column(nullable = false)
	private Integer userId;

	@jakarta.persistence.Convert(converter = com.officespace.converters.RequestTypeConverter.class)
	@Column(nullable = false, length = 20)
	private RequestType requestType;

	@Column(precision = 12, scale = 2)
	private BigDecimal offerPrice;

	private LocalDate proposedStart;

	private LocalDate proposedEnd;

	private String message;

	@jakarta.persistence.Convert(converter = com.officespace.converters.BookingStatusConverter.class)
	@Column(name = "status", nullable = false, columnDefinition = "VARCHAR(30) DEFAULT 'PENDING'")
	private BookingStatus status = BookingStatus.PENDING;

	private Integer reviewedBy;

	private LocalDateTime reviewedAt;

	private LocalDateTime createdAt;

	@PrePersist
	void applyDefaults() {
		if (status == null) {
			status = BookingStatus.PENDING;
		}

		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}
}