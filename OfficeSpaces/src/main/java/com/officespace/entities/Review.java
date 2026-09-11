package com.officespace.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
	name = "reviews",
	uniqueConstraints = {
		@UniqueConstraint(name = "uk_property_reviewer", columnNames = {"property_id", "reviewer_id"})
	}
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "review_id")
	private Integer reviewId;

	@Column(name = "property_id", nullable = false)
	private Integer propertyId;

	@Column(name = "reviewer_id", nullable = false)
	private Integer reviewerId;

	@Column(name = "rating", nullable = false)
	private Integer rating;

	@Column(name = "comment")
	private String comment;

	@Column(name = "created_at")
	private LocalDateTime createdAt;
}