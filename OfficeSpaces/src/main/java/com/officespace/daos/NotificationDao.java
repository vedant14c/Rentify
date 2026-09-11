package com.officespace.daos;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.officespace.entities.Notification;

public interface NotificationDao extends JpaRepository<Notification, Integer> {

	List<Notification> findByUserId(int userId);
}
