package com.unibite.project.claims.dto;

import com.unibite.project.claims.ClaimStatus;

import java.time.Instant;

public class ClaimResponse {
    public Long id;
    public Long listingId;
    public Long studentId;
    public int quantity;
    public ClaimStatus status;
    public String qrToken;
    public Instant claimedAt;

    public ClaimResponse(Long id, Long listingId, Long studentId, int quantity,
                         ClaimStatus status, String qrToken, Instant claimedAt) {
        this.id = id;
        this.listingId = listingId;
        this.studentId = studentId;
        this.quantity = quantity;
        this.status = status;
        this.qrToken = qrToken;
        this.claimedAt = claimedAt;
    }
}