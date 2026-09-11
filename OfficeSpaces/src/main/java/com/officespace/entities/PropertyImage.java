package com.officespace.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "property_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyImage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer imageId;

	@Column(nullable = false)
	private Integer propertyId;

	@Column(nullable = false)
	private String imageUrl;

	private LocalDateTime uploadedAt;
}