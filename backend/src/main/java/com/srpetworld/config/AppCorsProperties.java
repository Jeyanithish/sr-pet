package com.srpetworld.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.cors")
public record AppCorsProperties(
        @NotBlank(message = "CORS_ALLOWED_ORIGINS must be configured")
        String allowedOrigins
) {}
