package com.officespace.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Notification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer notificationId;

	@Column(nullable = false)
	private Integer userId;

	@Column(nullable = false)
	private String title;

	private String message;

	@jakarta.persistence.Convert(converter = com.officespace.converters.NotificationTypeConverter.class)
	@Column(nullable = false)
	private NotificationType type;

	private Boolean isRead;

	private LocalDateTime createdAt;
	@Column(name = "request_id")
	private Integer requestId;
}