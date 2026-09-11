package com.officespace.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer messageId;

    @Column(nullable = false)
    private Integer requestId;

    @Column(nullable = false)
    private Integer senderId;

    @Column(nullable = false)
    private String content;

    private Boolean isRead;

    private LocalDateTime sentAt;

    @PrePersist
    void applyDefaults() {
        isRead = false;
        sentAt = LocalDateTime.now();
    }
    
   
}