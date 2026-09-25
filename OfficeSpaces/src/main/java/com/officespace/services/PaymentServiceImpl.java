package com.officespace.services;

import java.time.LocalDateTime;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.officespace.daos.NotificationDao;
import com.officespace.daos.PaymentDao;
import com.officespace.daos.PropertyDao;
import com.officespace.daos.PropertyRequestDao;
import com.officespace.daos.UserDao;
import com.officespace.dtos.VerifyPaymentRequest;
import com.officespace.entities.BookingStatus;
import com.officespace.entities.Notification;
import com.officespace.entities.NotificationType;
import com.officespace.entities.Payment;
import com.officespace.entities.Property;
import com.officespace.entities.PropertyRequest;
import com.officespace.entities.Role;
import com.officespace.entities.User;
import com.officespace.security.AuthenticatedUserService;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class PaymentServiceImpl {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    private final PaymentDao paymentDao;
    private final PropertyRequestDao propertyRequestDao;
    private final PropertyDao propertyDao;
    private final BookingValidationService validationService;
    private final UserDao userDao;
    private final NotificationDao notificationDao;
    private final NotificationServiceImpl notificationServiceImpl;
    private final AuthenticatedUserService authenticatedUserService;
    public PaymentServiceImpl(
    		PaymentDao paymentDao,
    	    PropertyRequestDao propertyRequestDao,
    	    PropertyDao propertyDao,
    	    BookingValidationService validationService,
    	    UserDao userDao,
    	    NotificationDao notificationDao,
    	    NotificationServiceImpl notificationServiceImpl,
    	    AuthenticatedUserService authenticatedUserService
        
        
    ) {
    	this.paymentDao = paymentDao;
        this.propertyRequestDao = propertyRequestDao;
        this.propertyDao = propertyDao;
        this.validationService = validationService;
        this.userDao = userDao;
        this.notificationDao = notificationDao;
        this.notificationServiceImpl = notificationServiceImpl;
        this.authenticatedUserService = authenticatedUserService;
    }

    public Map<String, Object> createOrder(int requestId, int userId) {
        User authenticatedUser = authenticatedUserService.requireUser();
        if (authenticatedUser.getRole() == Role.OWNER) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Property owners cannot create rental payments.");
        }
        PropertyRequest request = propertyRequestDao.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Booking request not found with ID: " + requestId));

        if (!authenticatedUser.getId().equals(request.getUserId())) {
            throw new IllegalArgumentException("This booking request does not belong to the authenticated user.");
        }

        BookingStatus status = request.getStatus();

        if (status != BookingStatus.APPROVED
                && status != BookingStatus.PENDING_PAYMENT) {

            throw new IllegalStateException("Only approved or pending payment bookings can be paid for.");
        }

        if (validationService.isHoldExpired(request)) {
            request.setStatus(BookingStatus.EXPIRED);
            propertyRequestDao.save(request);
            throw new IllegalStateException("Payment hold period has expired. Please create a new booking request.");
        }

        Payment existingPayment = paymentDao.findFirstByRequestIdOrderByPaymentIdDesc(requestId);
        if (existingPayment != null && "PAID".equalsIgnoreCase(existingPayment.getStatus())) {
            throw new IllegalStateException("This booking has already been paid and confirmed.");
        }

        Property property = propertyDao.findById(request.getPropertyId())
            .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + request.getPropertyId()));

        double amount;
        if ("HOUR".equalsIgnoreCase(property.getPriceUnit())) {
            if (request.getStartTime() == null || request.getEndTime() == null) {
                throw new IllegalArgumentException("Structured hourly booking times are required.");
            }
            validationService.validateHourlyBooking(request, property);
            amount = property.getPrice() * Duration.between(request.getStartTime(), request.getEndTime()).toMinutes() / 60.0;
        } else {
            amount = request.getOfferPrice() != null
                ? request.getOfferPrice().doubleValue()
                : calculateDateRangeAmount(request, property);
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", Math.round(amount * 100)); // paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "request_" + requestId);

            Order order = client.orders.create(orderRequest);

            Payment payment = new Payment();
            payment.setRequestId(requestId);
            payment.setUserId(request.getUserId());
            payment.setAmount(amount);
            payment.setRazorpayOrderId(order.get("id"));
            payment.setStatus("CREATED");
            paymentDao.save(payment);

            return Map.of(
                "orderId", order.get("id").toString(),
                "amount", orderRequest.get("amount"),
                "currency", "INR",
                "keyId", keyId
            );
        } catch (Exception e) {
            throw new RuntimeException("Unable to create Razorpay payment order: " + e.getMessage(), e);
        }
    }

    private double calculateDateRangeAmount(PropertyRequest request, Property property) {
        if (request.getProposedStart() == null || request.getProposedEnd() == null) {
            throw new IllegalArgumentException("Booking dates are required.");
        }

        long days = ChronoUnit.DAYS.between(request.getProposedStart(), request.getProposedEnd());
        if (days <= 0) {
            throw new IllegalArgumentException("Booking checkout date must be after check-in date.");
        }

        String unit = property.getPriceUnit() == null ? "MONTH" : property.getPriceUnit().toUpperCase();
        long multiplier;
        switch (unit) {
            case "DAY":
            case "NIGHT":
                multiplier = days;
                break;
            case "WEEK":
                multiplier = Math.max(1, (days + 6) / 7);
                break;
            case "MONTH":
            default:
                multiplier = Math.max(1, (days + 29) / 30);
                break;
        }
        return property.getPrice() * multiplier;
    }

    public Payment verifyPayment(VerifyPaymentRequest verifyRequest) {
        Payment payment = paymentDao.findByRazorpayOrderId(verifyRequest.getRazorpayOrderId());

        if (payment == null) {
            throw new IllegalArgumentException("Payment record not found for order ID: " + verifyRequest.getRazorpayOrderId());
        }

        try {
            PropertyRequest request = propertyRequestDao.findById(payment.getRequestId())
                .orElseThrow(() -> new IllegalArgumentException("Booking request not found with ID: " + payment.getRequestId()));

            if ("PAID".equalsIgnoreCase(payment.getStatus())
                    || request.getStatus() == BookingStatus.CONFIRMED
                    || request.getStatus() == BookingStatus.confirmed) {
                return payment;
            }

            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", verifyRequest.getRazorpayOrderId());
            options.put("razorpay_payment_id", verifyRequest.getRazorpayPaymentId());
            options.put("razorpay_signature", verifyRequest.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

            if (!isValid) {
                payment.setStatus("FAILED");
                paymentDao.save(payment);
                throw new IllegalStateException("Payment signature verification failed.");
            }

            // Acquire row-level lock on property and re-verify availability before confirming
            Property property = propertyDao.findWithLockByPropertyId(request.getPropertyId())
                    .orElseThrow(() -> new IllegalArgumentException("Property not found with ID: " + request.getPropertyId()));

            boolean overlap;
            if ("HOUR".equalsIgnoreCase(property.getPriceUnit())) {
                validationService.validateHourlyBooking(request, property);
                overlap = validationService.hasHourlyOverlapExcludingRequest(
                        request.getPropertyId(),
                        request.getRequestId(),
                        request.getProposedStart(),
                        request.getStartTime(),
                        request.getEndTime());
            } else {
                overlap = validationService.hasOverlapExcludingRequest(
                        request.getPropertyId(),
                        request.getRequestId(),
                        request.getProposedStart(),
                        request.getProposedEnd());
            }

            if (overlap) {
                payment.setStatus("FAILED");
                paymentDao.save(payment);
                request.setStatus(BookingStatus.EXPIRED);
                propertyRequestDao.save(request);
                throw new IllegalStateException("These dates were booked by another user during payment processing.");
            }

            payment.setRazorpayPaymentId(verifyRequest.getRazorpayPaymentId());
            payment.setRazorpaySignature(verifyRequest.getRazorpaySignature());
            payment.setStatus("PAID");
            paymentDao.save(payment);

            request.setStatus(BookingStatus.CONFIRMED);
            propertyRequestDao.save(request);

            if (property != null) {
                User owner = userDao.findById(property.getOwnerId()).orElse(null);
                if (owner != null) {
                    Notification notification = new Notification();
                    notification.setUserId(owner.getId());
                    notification.setRequestId(request.getRequestId());
                    notification.setTitle("Payment Received");
                    notification.setMessage("Payment confirmed for your property \"" + property.getTitle() + "\".");
                    notification.setType(NotificationType.RENTAL);
                    notification.setIsRead(false);
                    notification.setCreatedAt(LocalDateTime.now());
                    notificationDao.save(notification);

                    if (owner.getFcmToken() != null) {
                        notificationServiceImpl.sendPushNotification(
                                owner.getFcmToken(),
                                "Payment Received",
                                "Payment confirmed for your property \"" + property.getTitle() + "\".",
                                "PAYMENT",
                                String.valueOf(request.getRequestId())
                        );
                    }
                }
            }

            return payment;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Verification error: " + e.getMessage(), e);
        }
    }
}