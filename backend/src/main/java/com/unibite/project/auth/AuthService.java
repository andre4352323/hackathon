package com.unibite.project.auth;

import com.unibite.project.auth.dto.AuthResponse;
import com.unibite.project.auth.dto.LoginRequest;
import com.unibite.project.auth.dto.RegisterRequest;
import com.unibite.project.users.User;
import com.unibite.project.users.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final SessionRepository sessionRepo;

    public AuthService(UserRepository userRepo, SessionRepository sessionRepo) {
        this.userRepo = userRepo;
        this.sessionRepo = sessionRepo;
    }

    public void register(RegisterRequest req) {
        if (userRepo.findByEmail(req.email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        String role = req.role.toUpperCase();
        if (!role.equals("STUDENT") && !role.equals("RESTAURANT")) {
            throw new RuntimeException("Invalid role");
        }

        User user = new User();
        user.setEmail(req.email);
        user.setPasswordHash(req.password);
        user.setRole(role);
        user.setPhone(req.phone);

        userRepo.save(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.email)
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!req.password.equals(user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        sessionRepo.save(new Session(token, user.getId(), expiresAt));

        return new AuthResponse(token, user.getId(), user.getRole(), user.getEmail());
    }

    public void logout(String token) {
        sessionRepo.deleteById(token);
    }
}