package com.srpetworld.dto;

import com.srpetworld.entity.OrderStatus;
import jakarta.validation.constraints.NotBlank;

public class PaymentDtos {

    public record PaymentVerifyRequest(
            @NotBlank(message = "Razorpay Order ID is required")
            String razorpayOrderId,

            @NotBlank(message = "Razorpay Payment ID is required")
            String razorpayPaymentId,

            @NotBlank(message = "Razorpay Signature is required")
            String razorpaySignature
    ) {}

    public record PaymentVerifyResponse(
            String orderCode,
            OrderStatus status,
            String razorpayPaymentId,
            String message
    ) {}
}
