package com.officespace.controllers;

import java.util.Map;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.officespace.dtos.VerifyPaymentRequest;
import com.officespace.entities.Payment;
import com.officespace.services.PaymentServiceImpl;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentServiceImpl paymentService;

    public PaymentController(PaymentServiceImpl paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create-order/{requestId}")
    public Map<String, Object> createOrder(
        @PathVariable int requestId,
        @RequestBody(required = false) Map<String, Integer> body
    ) {
        int userId = (body != null && body.containsKey("userId") && body.get("userId") != null) ? body.get("userId") : 0;
        return paymentService.createOrder(requestId, userId);
    }

    @PostMapping("/verify")
    public Payment verify(@RequestBody VerifyPaymentRequest request) {
        return paymentService.verifyPayment(request);
    }
}