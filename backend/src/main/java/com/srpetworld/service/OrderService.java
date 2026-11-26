package com.srpetworld.service;

import com.srpetworld.dto.OrderDtos.*;
import com.srpetworld.dto.PaymentDtos.PaymentVerifyRequest;
import com.srpetworld.dto.PaymentDtos.PaymentVerifyResponse;
import com.srpetworld.entity.*;
import com.srpetworld.exception.ApiException;
import com.srpetworld.repository.BirdRepository;
import com.srpetworld.repository.OrderRepository;
import com.srpetworld.repository.PaymentRepository;
import com.srpetworld.repository.UserRepository;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private static final BigDecimal DELIVERY_FEE_INR = new BigDecimal("150.00");

    private final OrderRepository orderRepository;
    private final BirdRepository birdRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final RazorpayService razorpayService;

    public OrderService(OrderRepository orderRepository,
                        BirdRepository birdRepository,
                        UserRepository userRepository,
                        PaymentRepository paymentRepository,
                        RazorpayService razorpayService) {
        this.orderRepository = orderRepository;
        this.birdRepository = birdRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.razorpayService = razorpayService;
    }

    @Transactional
    public CheckoutResponse createCheckoutOrder(String userEmail, CheckoutRequest request) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (request.fulfillmentType() == FulfillmentType.DELIVERY &&
                (request.deliveryAddress() == null || request.deliveryAddress().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Delivery address is required for Farm Delivery");
        }

        Order order = new Order();
        order.setOrderCode("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setUser(user);
        order.setCustomerName(InputSanitizer.sanitizeText(request.customerName(), 100));
        order.setCustomerPhone(request.customerPhone().trim());
        order.setDeliveryAddress(request.fulfillmentType() == FulfillmentType.DELIVERY
                ? InputSanitizer.sanitizeText(request.deliveryAddress(), 500)
                : "Farm Pickup — SR Pet World Aviary");
        order.setFulfillmentType(request.fulfillmentType());
        order.setStatus(OrderStatus.PENDING_PAYMENT);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CheckoutItemRequest itemReq : request.items()) {
            Bird bird = birdRepository.findById(itemReq.birdId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Bird not found: " + itemReq.birdId()));

            if (!Boolean.TRUE.equals(bird.getActive())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, bird.getName() + " is currently unavailable");
            }
            if (bird.getStockQuantity() < itemReq.quantity()) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Insufficient stock for " + bird.getName() + " (available: " + bird.getStockQuantity() + ")");
            }

            OrderItem item = new OrderItem();
            item.setBird(bird);
            item.setBirdNameSnapshot(bird.getName());
            item.setUnitPriceInr(bird.getPriceInr());
            item.setQuantity(itemReq.quantity());
            order.addItem(item);

            subtotal = subtotal.add(bird.getPriceInr().multiply(BigDecimal.valueOf(itemReq.quantity())));
        }

        BigDecimal deliveryFee = request.fulfillmentType() == FulfillmentType.DELIVERY
                ? DELIVERY_FEE_INR
                : BigDecimal.ZERO;
        BigDecimal totalInr = subtotal.add(deliveryFee);

        order.setSubtotalInr(subtotal);
        order.setDeliveryFeeInr(deliveryFee);
        order.setTotalInr(totalInr);

        Order savedOrder = orderRepository.save(order);

        long amountPaise = totalInr.multiply(BigDecimal.valueOf(100)).longValueExact();
        String razorpayOrderId = razorpayService.createRazorpayOrder(savedOrder.getOrderCode(), amountPaise, "INR");

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setAmountPaise(amountPaise);
        payment.setCurrency("INR");
        payment.setStatus(PaymentStatus.CREATED);
        paymentRepository.save(payment);

        return new CheckoutResponse(
                savedOrder.getOrderCode(),
                razorpayOrderId,
                amountPaise,
                "INR",
                razorpayService.getKeyId(),
                totalInr
        );
    }

    @Transactional
    public PaymentVerifyResponse verifyAndCapturePayment(PaymentVerifyRequest request) {
        if (!razorpayService.verifyPaymentSignature(
                request.razorpayOrderId(),
                request.razorpayPaymentId(),
                request.razorpaySignature())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid Razorpay payment signature");
        }

        Payment payment = paymentRepository.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment record not found"));

        Order order = payment.getOrder();
        if (payment.getStatus() == PaymentStatus.CAPTURED) {
            return new PaymentVerifyResponse(
                    order.getOrderCode(),
                    order.getStatus(),
                    payment.getRazorpayPaymentId(),
                    "Payment already verified"
            );
        }

        markCapturedAndDeductStock(payment, order, request.razorpayPaymentId(), request.razorpaySignature(), "checkout");

        return new PaymentVerifyResponse(
                order.getOrderCode(),
                order.getStatus(),
                payment.getRazorpayPaymentId(),
                "Payment verified and order confirmed"
        );
    }

    @Transactional
    public void handleWebhookEvent(String rawBody, String signatureHeader) {
        if (!razorpayService.verifyWebhookSignature(rawBody, signatureHeader)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid Razorpay webhook signature");
        }

        JSONObject root = new JSONObject(rawBody);
        String event = root.optString("event", "");
        JSONObject paymentEntity = root.getJSONObject("payload")
                .getJSONObject("payment")
                .getJSONObject("entity");

        String razorpayOrderId = paymentEntity.optString("order_id", "");
        String razorpayPaymentId = paymentEntity.optString("id", "");
        String method = paymentEntity.optString("method", "razorpay");

        Payment payment = paymentRepository.findByRazorpayOrderId(razorpayOrderId).orElse(null);
        if (payment == null) {
            return;
        }

        Order order = payment.getOrder();
        if ("payment.captured".equals(event)) {
            if (payment.getStatus() != PaymentStatus.CAPTURED) {
                markCapturedAndDeductStock(payment, order, razorpayPaymentId, signatureHeader, method);
            }
        } else if ("payment.failed".equals(event)) {
            if (payment.getStatus() == PaymentStatus.CREATED) {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setRazorpayPaymentId(razorpayPaymentId);
                paymentRepository.save(payment);
            }
        }
    }

    private void markCapturedAndDeductStock(Payment payment,
                                            Order order,
                                            String razorpayPaymentId,
                                            String signature,
                                            String method) {
        for (OrderItem item : order.getItems()) {
            Bird bird = item.getBird();
            if (bird.getStockQuantity() < item.getQuantity()) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Insufficient stock to confirm order for " + bird.getName());
            }
            bird.setStockQuantity(bird.getStockQuantity() - item.getQuantity());
            bird.setUnitsSold(bird.getUnitsSold() + item.getQuantity());
            birdRepository.save(bird);
        }

        payment.setRazorpayPaymentId(razorpayPaymentId);
        payment.setRazorpaySignature(signature);
        payment.setPaymentMethod(method);
        payment.setStatus(PaymentStatus.CAPTURED);
        payment.setVerifiedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
    }

    public List<OrderDto> getMyOrders(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    public OrderDto getMyOrderByCode(String userEmail, String orderCode) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
        Order order = orderRepository.findByOrderCodeAndUserId(orderCode, user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        return toDto(order);
    }

    public List<OrderDto> getAllOrdersAdmin() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public OrderDto updateOrderStatus(String orderCode, OrderStatus newStatus) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found: " + orderCode));
        order.setStatus(newStatus);
        return toDto(orderRepository.save(order));
    }

    public OrderDto toDto(Order order) {
        List<OrderItemDto> itemDtos = order.getItems().stream()
                .map(i -> new OrderItemDto(
                        i.getBird().getId(),
                        i.getBirdNameSnapshot(),
                        i.getUnitPriceInr(),
                        i.getQuantity()
                ))
                .toList();
        String rzpPaymentId = order.getPayment() != null ? order.getPayment().getRazorpayPaymentId() : null;
        return new OrderDto(
                order.getOrderCode(),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getDeliveryAddress(),
                order.getFulfillmentType(),
                order.getSubtotalInr(),
                order.getDeliveryFeeInr(),
                order.getTotalInr(),
                order.getStatus(),
                rzpPaymentId,
                order.getCreatedAt(),
                itemDtos
        );
    }
}
