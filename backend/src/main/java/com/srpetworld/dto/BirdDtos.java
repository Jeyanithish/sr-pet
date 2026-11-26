package com.srpetworld.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class BirdDtos {

    public record BirdDto(
            Long id,
            String name,
            String category,
            String ageTag,
            String description,
            BigDecimal priceInr,
            Integer stockQuantity,
            Integer unitsSold,
            String imageUrl,
            Boolean active
    ) {}

    public record BirdUpsertRequest(
            @NotBlank(message = "Bird name is required")
            @Size(max = 150)
            String name,

            @NotBlank(message = "Category is required")
            @Size(max = 50)
            String category,

            @Size(max = 100)
            String ageTag,

            String description,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "1.00", message = "Price must be at least ₹1")
            BigDecimal priceInr,

            @NotNull(message = "Stock quantity is required")
            @Min(value = 0, message = "Stock cannot be negative")
            Integer stockQuantity,

            @Size(max = 500)
            String imageUrl,

            Boolean active
    ) {}
}
