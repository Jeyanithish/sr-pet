package com.srpetworld.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.srpetworld.config.RazorpayConfig;
import com.srpetworld.exception.ApiException;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class RazorpayService {

    private final RazorpayConfig razorpayConfig;

    public RazorpayService(RazorpayConfig razorpayConfig) {
        this.razorpayConfig = razorpayConfig;
    }

    public String createRazorpayOrder(String orderCode, long amountPaise, String currency) {
        if (!razorpayConfig.isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Razorpay credentials are not configured on the server");
        }
        try {
            RazorpayClient client = new RazorpayClient(razorpayConfig.getKeyId(), razorpayConfig.getKeySecret());
            JSONObject options = new JSONObject();
            options.put("amount", amountPaise);
            options.put("currency", currency);
            options.put("receipt", orderCode);
            options.put("payment_capture", 1);

            Order razorpayOrder = client.orders.create(options);
            return razorpayOrder.get("id");
        } catch (RazorpayException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Failed to initiate Razorpay order: " + e.getMessage());
        }
    }

    public boolean verifyPaymentSignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        if (razorpayConfig.getKeySecret() == null || razorpayConfig.getKeySecret().isBlank()) {
            return false;
        }
        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        return verifyHmacSha256(payload, razorpaySignature, razorpayConfig.getKeySecret());
    }

    public boolean verifyWebhookSignature(String rawBody, String signatureHeader) {
        if (razorpayConfig.getWebhookSecret() == null || razorpayConfig.getWebhookSecret().isBlank() || signatureHeader == null) {
            return false;
        }
        return verifyHmacSha256(rawBody, signatureHeader, razorpayConfig.getWebhookSecret());
    }

    public static boolean verifyHmacSha256(String payload, String expectedSignature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return MessageDigest.isEqual(
                    hex.toString().getBytes(StandardCharsets.UTF_8),
                    expectedSignature.trim().getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    public String getKeyId() {
        return razorpayConfig.getKeyId();
    }
}
