package com.srpetworld.controller;

import com.srpetworld.dto.OrderDtos.*;
import com.srpetworld.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/api/orders/checkout")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CheckoutResponse> checkout(Authentication authentication,
                                                     @Valid @RequestBody CheckoutRequest request) {
        return ResponseEntity.ok(orderService.createCheckoutOrder(authentication.getName(), request));
    }

    @GetMapping("/api/orders/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<OrderDto>> getMyOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.getMyOrders(authentication.getName()));
    }

    @GetMapping("/api/orders/{orderCode}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<OrderDto> getMyOrderByCode(Authentication authentication,
                                                     @PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getMyOrderByCode(authentication.getName(), orderCode));
    }

    @GetMapping("/api/admin/orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrdersAdmin());
    }

    @PatchMapping("/api/admin/orders/{orderCode}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDto> updateStatus(@PathVariable String orderCode,
                                                 @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderCode, request.status()));
    }
}
