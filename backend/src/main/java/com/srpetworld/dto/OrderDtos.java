package com.srpetworld.dto;

import com.srpetworld.entity.FulfillmentType;
import com.srpetworld.entity.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDtos {

    public record CheckoutItemRequest(
            @NotNull(message = "Bird ID is required")
            Long birdId,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            @Max(value = 50, message = "Quantity cannot exceed 50 per item")
            Integer quantity
    ) {}

    public record CheckoutRequest(
            @NotBlank(message = "Customer name is required")
            @Size(min = 2, max = 100)
            String customerName,

            @NotBlank(message = "Phone number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be a valid 10-digit Indian mobile number")
            String customerPhone,

            @Size(max = 500)
            String deliveryAddress,

            @NotNull(message = "Fulfillment type is required")
            FulfillmentType fulfillmentType,

            @NotEmpty(message = "Basket cannot be empty")
            @Size(max = 20, message = "Too many line items")
            @Valid
            List<CheckoutItemRequest> items
    ) {}

    public record CheckoutResponse(
            String orderCode,
            String razorpayOrderId,
            long amountPaise,
            String currency,
            String razorpayKeyId,
            BigDecimal totalInr
    ) {}

    public record OrderItemDto(
            Long birdId,
            String birdName,
            BigDecimal unitPriceInr,
            Integer quantity
    ) {}

    public record OrderDto(
            String orderCode,
            String customerName,
            String customerPhone,
            String deliveryAddress,
            FulfillmentType fulfillmentType,
            BigDecimal subtotalInr,
            BigDecimal deliveryFeeInr,
            BigDecimal totalInr,
            OrderStatus status,
            String razorpayPaymentId,
            LocalDateTime createdAt,
            List<OrderItemDto> items
    ) {}

    public record UpdateOrderStatusRequest(
            @NotNull(message = "Order status is required")
            OrderStatus status
    ) {}
}
