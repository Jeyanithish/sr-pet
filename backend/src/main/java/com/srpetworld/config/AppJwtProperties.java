package com.srpetworld.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record AppJwtProperties(
        @NotBlank(message = "JWT_SECRET must be configured")
        @Size(min = 32, message = "JWT_SECRET must be at least 32 characters (256 bits)")
        String secret,

        @NotBlank
        String issuer,

        @Min(60000)
        long expirationMs,

        @Min(60000)
        long refreshExpirationMs
) {}
