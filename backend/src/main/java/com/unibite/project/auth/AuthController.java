package com.unibite.project.auth;

import com.unibite.project.auth.dto.AuthResponse;
import com.unibite.project.auth.dto.LoginRequest;
import com.unibite.project.auth.dto.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public String register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return "registered";
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/logout")
    public String logout(@RequestHeader("X-Session-Token") String token) {
        authService.logout(token);
        return "logged out";
    }
}