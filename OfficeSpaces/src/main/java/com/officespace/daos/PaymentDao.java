package com.officespace.daos;

import org.springframework.data.jpa.repository.JpaRepository;

import com.officespace.entities.Payment;

public interface PaymentDao extends JpaRepository<Payment, Integer> {

    Payment findByRazorpayOrderId(String razorpayOrderId);
}