package com.srpetworld;

import com.srpetworld.dto.OrderDtos.CheckoutItemRequest;
import com.srpetworld.dto.OrderDtos.CheckoutRequest;
import com.srpetworld.dto.OrderDtos.CheckoutResponse;
import com.srpetworld.dto.PaymentDtos.PaymentVerifyRequest;
import com.srpetworld.dto.PaymentDtos.PaymentVerifyResponse;
import com.srpetworld.entity.Bird;
import com.srpetworld.entity.FulfillmentType;
import com.srpetworld.entity.OrderStatus;
import com.srpetworld.exception.ApiException;
import com.srpetworld.repository.BirdRepository;
import com.srpetworld.service.OrderService;
import com.srpetworld.service.RazorpayService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OrderAndRazorpayTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private BirdRepository birdRepository;

    @MockitoBean
    private RazorpayService razorpayService;

    @Test
    void razorpayHmacSha256VerificationWorks() throws Exception {
        String orderId = "order_RzpTest123";
        String paymentId = "pay_RzpTest456";
        String secret = "rzp_test_mock_secret_key_12345";

        String payload = orderId + "|" + paymentId;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }

        assertTrue(RazorpayService.verifyHmacSha256(payload, hex.toString(), secret));
        assertFalse(RazorpayService.verifyHmacSha256(payload, "tampered_signature", secret));
    }

    @Test
    void checkoutRejectsInsufficientStock() {
        Bird budgie = birdRepository.findAll().get(0);
        int tooMany = budgie.getStockQuantity() + 50;

        CheckoutRequest request = new CheckoutRequest(
                "Karthik Rajan",
                "9840098765",
                "14 Gandhi Nagar, Coimbatore",
                FulfillmentType.DELIVERY,
                List.of(new CheckoutItemRequest(budgie.getId(), tooMany))
        );

        assertThrows(ApiException.class, () ->
                orderService.createCheckoutOrder("user@srpetworld.in", request));
    }

    @Test
    void checkoutAndVerifyPaymentDeductsStockAtomically() {
        Bird budgie = birdRepository.findAll().get(0);
        int initialStock = budgie.getStockQuantity();
        int initialSold = budgie.getUnitsSold();

        when(razorpayService.createRazorpayOrder(anyString(), anyLong(), anyString()))
                .thenReturn("order_mock_rzp_999");
        when(razorpayService.getKeyId()).thenReturn("rzp_test_mock_key");
        when(razorpayService.verifyPaymentSignature("order_mock_rzp_999", "pay_mock_777", "valid_sig"))
                .thenReturn(true);

        CheckoutResponse checkout = orderService.createCheckoutOrder("user@srpetworld.in", new CheckoutRequest(
                "Karthik Rajan",
                "9840098765",
                "14 Gandhi Nagar, Coimbatore",
                FulfillmentType.DELIVERY,
                List.of(new CheckoutItemRequest(budgie.getId(), 2))
        ));

        assertEquals("order_mock_rzp_999", checkout.razorpayOrderId());
        // 2 * 650 + 150 delivery = 1450 INR => 145000 paise
        assertEquals(145000L, checkout.amountPaise());

        PaymentVerifyResponse verified = orderService.verifyAndCapturePayment(new PaymentVerifyRequest(
                "order_mock_rzp_999",
                "pay_mock_777",
                "valid_sig"
        ));

        assertEquals(OrderStatus.CONFIRMED, verified.status());
        Bird updated = birdRepository.findById(budgie.getId()).orElseThrow();
        assertEquals(initialStock - 2, updated.getStockQuantity());
        assertEquals(initialSold + 2, updated.getUnitsSold());
    }
}
