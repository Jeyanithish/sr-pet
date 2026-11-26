package com.srpetworld.controller;

import com.srpetworld.dto.PaymentDtos.PaymentVerifyRequest;
import com.srpetworld.dto.PaymentDtos.PaymentVerifyResponse;
import com.srpetworld.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final OrderService orderService;

    public PaymentController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<PaymentVerifyResponse> verifyPayment(@Valid @RequestBody PaymentVerifyRequest request) {
        return ResponseEntity.ok(orderService.verifyAndCapturePayment(request));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        orderService.handleWebhookEvent(rawBody, signature);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
