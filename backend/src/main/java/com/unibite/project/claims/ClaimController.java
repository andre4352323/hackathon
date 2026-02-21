package com.unibite.project.claims;

import com.unibite.project.claims.dto.ClaimResponse;
import com.unibite.project.claims.dto.CreateClaimRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    // Student claims a listing
    @PostMapping
    public ClaimResponse create(@RequestBody CreateClaimRequest req) {
        return claimService.createClaim(req);
    }

    // Student: view their claims
    @GetMapping("/student/{studentId}")
    public List<Claim> byStudent(@PathVariable Long studentId) {
        return claimService.getClaimsByStudent(studentId);
    }

    // Restaurant: view claims for a listing
    @GetMapping("/listing/{listingId}")
    public List<Claim> byListing(@PathVariable Long listingId) {
        return claimService.getClaimsByListing(listingId);
    }

    // Restaurant: redeem claim by token
    @PostMapping("/redeem")
    public Claim redeem(@RequestParam String qrToken) {
        return claimService.redeemByToken(qrToken);
    }

    @PostMapping("/{claimId}/cancel")
    public Claim cancel(@PathVariable Long claimId) {
        return claimService.cancelClaim(claimId);
    }
}