package com.officespace.entities;

import java.time.LocalDateTime;

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
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer paymentId;

    private Integer requestId;

    private Integer userId;

    private Double amount;

    private String currency;

    private String razorpayOrderId;

    private String razorpayPaymentId;

    private String razorpaySignature;

    private String status;

    private LocalDateTime createdAt;

    @PrePersist
    void applyDefaults() {
        if (status == null) {
            status = "CREATED";
        }
        if (currency == null) {
            currency = "INR";
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}