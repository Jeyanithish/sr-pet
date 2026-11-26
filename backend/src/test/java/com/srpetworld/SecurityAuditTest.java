package com.srpetworld;

import com.srpetworld.config.RateLimitFilter;
import com.srpetworld.dto.AuthDtos.RegisterRequest;
import com.srpetworld.entity.Bird;
import com.srpetworld.repository.BirdRepository;
import com.srpetworld.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityAuditTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private BirdRepository birdRepository;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void resetRateLimiter() {
        rateLimitFilter.clearBuckets();
    }

    @Test
    void unauthenticatedRequestsReturn401() throws Exception {
        mockMvc.perform(get("/api/orders/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void customerCallingAdminEndpointsReturns403() throws Exception {
        String userToken = authService.register(new RegisterRequest(
                "Priya Kumar", "priya@example.com", "9876543211", "Strong@123"
        )).token();

        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/analytics/summary")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCannotReadAnotherCustomersOrderIdor() throws Exception {
        String otherUserToken = authService.register(new RegisterRequest(
                "Other Buyer", "other@example.com", "9876543212", "Strong@123"
        )).token();

        // ORD-2401 belongs to seeded user@srpetworld.in
        mockMvc.perform(get("/api/orders/ORD-2401")
                        .header("Authorization", "Bearer " + otherUserToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidRazorpaySignatureIsRejectedAndDoesNotDeductStock() throws Exception {
        String userToken = authService.register(new RegisterRequest(
                "Ramesh Babu", "ramesh@example.com", "9876543213", "Strong@123"
        )).token();

        Bird firstBird = birdRepository.findAll().get(0);
        int stockBefore = firstBird.getStockQuantity();

        mockMvc.perform(post("/api/payments/verify")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "razorpayOrderId": "order_seed_2401",
                                  "razorpayPaymentId": "pay_tampered",
                                  "razorpaySignature": "invalid_hmac_signature"
                                }
                                """))
                .andExpect(status().isBadRequest());

        Bird after = birdRepository.findById(firstBird.getId()).orElseThrow();
        assertEquals(stockBefore, after.getStockQuantity());
    }

    @Test
    void bruteForceLoginTriggers429RateLimit() throws Exception {
        String body = """
                {
                  "email": "admin@srpetworld.in",
                  "password": "WrongPassword!1"
                }
                """;

        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "203.0.113.55")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "203.0.113.55")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void securityHeadersArePresentAndUnknownJsonPropertiesRejected() throws Exception {
        mockMvc.perform(get("/api/birds"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().string("Content-Security-Policy", containsString("object-src 'none'")));

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "203.0.113.99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "user@srpetworld.in",
                                  "password": "user123",
                                  "role": "ROLE_ADMIN"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }
}
