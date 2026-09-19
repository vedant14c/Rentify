package com.officespace.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.officespace.daos.NotificationDao;
import com.officespace.entities.Notification;

import jakarta.transaction.Transactional;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;

@Service
@Transactional
public class NotificationServiceImpl {
	@Autowired
	private NotificationDao notificationDao;

	public Notification addNotification(Notification notification) {

		notification.setIsRead(false);

		return notificationDao.save(notification);
	}

	public List<Notification> getNotificationsByUserId(int userId) {

		return notificationDao.findByUserId(userId);
	}

	public Notification getNotificationById(int id) {

		return notificationDao.findById(id).orElse(null);
	}

	public Notification markAsRead(int id) {

		Notification notification = notificationDao.findById(id).orElse(null);

		if (notification != null) {

			notification.setIsRead(true);

			return notificationDao.save(notification);
		}

		return null;
	}

	public void sendPushNotification(String fcmToken, String title, String body,
            String type, String targetId) {

					if (fcmToken == null || fcmToken.isEmpty()) return;
					
					try {
					
					Message message = Message.builder()
					.setToken(fcmToken)
					.putData("type", type)
					.putData("targetId", targetId)
					.setNotification(
					   com.google.firebase.messaging.Notification.builder()
					           .setTitle(title)
					           .setBody(body)
					           .build())
					.build();
					
					FirebaseMessaging.getInstance().send(message);
					
					} catch (Exception e) {
					e.printStackTrace();
					}
					}
}
