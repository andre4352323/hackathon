package com.unibite.project.auth.dto;

import jakarta.validation.constraints.*;

public class RegisterRequest {

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    public String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    public String password;

    @NotBlank(message = "Role is required")
    public String role; // "STUDENT" or "RESTAURANT"

    public String phone;

    public String displayName;

    @Min(value = 1, message = "Daily claim limit must be at least 1")
    public Integer dailyClaimLimit;

    // ---- Restaurant-specific fields ----
    public String restaurantName;
    public String address;
    public String mapLink;
}