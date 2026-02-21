package com.unibite.project.auth.dto;

public class AuthResponse {
    public String sessionToken;
    public Long userId;
    public String role;
    public String email;
    public String displayName;
    public String qrToken;

    public AuthResponse(String sessionToken, Long userId, String role, String email, String displayName, String qrToken) {
        this.sessionToken = sessionToken;
        this.userId = userId;
        this.role = role;
        this.email = email;
        this.displayName = displayName;
        this.qrToken = qrToken;
    }
}
