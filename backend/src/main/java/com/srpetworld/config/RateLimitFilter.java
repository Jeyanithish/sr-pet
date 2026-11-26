package com.srpetworld.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;

    private final int authLimit;
    private final int paymentLimit;
    private final int generalLimit;
    private final Map<String, WindowCounter> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${app.rate-limit.auth-per-min:10}") int authLimit,
            @Value("${app.rate-limit.payment-per-min:20}") int paymentLimit,
            @Value("${app.rate-limit.general-per-min:100}") int generalLimit
    ) {
        this.authLimit = authLimit;
        this.paymentLimit = paymentLimit;
        this.generalLimit = generalLimit;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);

        String bucketTier;
        int limit;
        if (path.equals("/api/auth/login") || path.equals("/api/auth/register")) {
            bucketTier = "AUTH";
            limit = authLimit;
        } else if (path.equals("/api/orders/checkout") || path.startsWith("/api/payments/")) {
            bucketTier = "PAY";
            limit = paymentLimit;
        } else {
            bucketTier = "API";
            limit = generalLimit;
        }

        String key = bucketTier + ":" + clientIp;
        long now = System.currentTimeMillis();
        WindowCounter counter = buckets.computeIfAbsent(key, k -> new WindowCounter(now));

        long retryAfterSec = counter.tryConsume(now, limit);
        if (retryAfterSec > 0) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", String.valueOf(retryAfterSec));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please retry later.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    public void clearBuckets() {
        buckets.clear();
    }

    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private static final class WindowCounter {
        private long windowStart;
        private int count;

        WindowCounter(long now) {
            this.windowStart = now;
            this.count = 0;
        }

        synchronized long tryConsume(long now, int limit) {
            if (now - windowStart >= WINDOW_MS) {
                windowStart = now;
                count = 0;
            }
            if (count >= limit) {
                long remainingMs = WINDOW_MS - (now - windowStart);
                return Math.max(1L, (remainingMs + 999L) / 1000L);
            }
            count++;
            return 0L;
        }
    }
}
