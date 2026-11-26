package com.srpetworld.dto;

import com.srpetworld.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            @Size(max = 150)
            String email,

            @Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Phone must be a valid 10-digit Indian mobile number")
            String phone,

            @NotBlank(message = "Password is required")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,100}$",
                    message = "Password must be at least 8 characters with uppercase, lowercase, number, and symbol"
            )
            String password
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            @Size(max = 150)
            String email,

            @NotBlank(message = "Password is required")
            @Size(max = 100)
            String password
    ) {}

    public record UserProfileDto(
            Long id,
            String fullName,
            String email,
            String phone,
            Role role
    ) {}

    public record AuthResponse(
            String token,
            UserProfileDto user
    ) {}
}
