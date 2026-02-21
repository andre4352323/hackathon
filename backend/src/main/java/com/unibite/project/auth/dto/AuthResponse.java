package com.unibite.project.auth.dto;

public class AuthResponse {
    public String sessionToken;
    public Long userId;
    public String role;
    public String email;

    public AuthResponse(String sessionToken, Long userId, String role, String email) {
        this.sessionToken = sessionToken;
        this.userId = userId;
        this.role = role;
        this.email = email;
    }
}