package com.officespace.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.officespace.entities.Notification;
import com.officespace.services.NotificationServiceImpl;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

	@Autowired
	private NotificationServiceImpl notificationServiceImpl;

	@PostMapping
	public Notification addNotification(@RequestBody Notification notification) {

		return notificationServiceImpl.addNotification(notification);
	}

	@GetMapping("/user/{userId}")
	public List<Notification> getNotificationsByUserId(@PathVariable int userId) {

		return notificationServiceImpl.getNotificationsByUserId(userId);
	}

	@GetMapping("/{id}")
	public Notification getNotificationById(@PathVariable int id) {

		return notificationServiceImpl.getNotificationById(id);
	}

	// this marks notification as read
	@PutMapping("/read/{id}")
	public Notification markAsRead(@PathVariable int id) {

		return notificationServiceImpl.markAsRead(id);
	}
	
	@GetMapping("/test")
	public String testNotification() {

	    String token = "PASTE_YOUR_FCM_TOKEN";

	    notificationServiceImpl.sendPushNotification(
	            token,
	            "Test Title",
	            "Hello from backend",
	            "TEST",
	            "1"
	    );

	    return "Notification sent";
	}

}
