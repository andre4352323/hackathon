package com.unibite.project.claims;

import com.unibite.project.claims.dto.ClaimResponse;
import com.unibite.project.claims.dto.CreateClaimRequest;
import com.unibite.project.listings.FoodListing;
import com.unibite.project.listings.FoodListingRepository;
import com.unibite.project.users.User;
import com.unibite.project.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ClaimService {

    private final ClaimRepository claimRepo;
    private final FoodListingRepository listingRepo;
    private final UserRepository userRepo;

    public ClaimService(ClaimRepository claimRepo, FoodListingRepository listingRepo, UserRepository userRepo) {
        this.claimRepo = claimRepo;
        this.listingRepo = listingRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public ClaimResponse createClaim(CreateClaimRequest req) {
        if (req.listingId == null) throw new RuntimeException("listingId is required");
        if (req.studentId == null) throw new RuntimeException("studentId is required");
        if (req.quantity <= 0) throw new RuntimeException("quantity must be > 0");

        FoodListing listing = listingRepo.findById(req.listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (listing.getRemainingQuantity() <= 0) {
            throw new RuntimeException("Listing is sold out");
        }

        if (req.quantity > listing.getPerPersonLimit()) {
            throw new RuntimeException("Quantity exceeds per-person limit");
        }

        if (req.quantity > listing.getRemainingQuantity()) {
            throw new RuntimeException("Not enough quantity remaining");
        }

        // Decrease remaining quantity
        listing.setRemainingQuantity(listing.getRemainingQuantity() - req.quantity);
        listingRepo.save(listing);

        // Create claim
        Claim claim = new Claim();
        claim.setListingId(req.listingId);
        claim.setStudentId(req.studentId);
        claim.setQuantity(req.quantity);
        claim.setStatus(ClaimStatus.CLAIMED);
        claim.setQrToken(UUID.randomUUID().toString());

        Claim saved = claimRepo.save(claim);

        return new ClaimResponse(
                saved.getId(),
                saved.getListingId(),
                saved.getStudentId(),
                saved.getQuantity(),
                saved.getStatus(),
                saved.getQrToken(),
                saved.getClaimedAt()
        );
    }

    public List<Claim> getClaimsByStudent(Long studentId) {
        return claimRepo.findByStudentId(studentId);
    }

    public List<Claim> getClaimsByListing(Long listingId) {
        return claimRepo.findByListingId(listingId);
    }

    @Transactional
    public Claim redeemByToken(String qrToken) {
        Claim claim = claimRepo.findByQrToken(qrToken).orElse(null);

        // If not a claim token, treat it as user QR token and redeem latest active claim.
        if (claim == null) {
            User user = userRepo.findByQrToken(qrToken)
                    .orElseThrow(() -> new RuntimeException("Invalid QR token"));

            claim = claimRepo.findFirstByStudentIdAndStatusOrderByClaimedAtDesc(user.getId(), ClaimStatus.CLAIMED)
                    .orElseThrow(() -> new RuntimeException("No active claim found for this user"));
        }

        if (claim.getStatus() == ClaimStatus.REDEEMED) {
            throw new RuntimeException("Already redeemed");
        }

        claim.setStatus(ClaimStatus.REDEEMED);
        claim.setRedeemedAt(Instant.now());
        return claimRepo.save(claim);
    }

    @Transactional
    public Claim cancelClaim(Long claimId) {
        Claim claim = claimRepo.findById(claimId)
                .orElseThrow(() -> new RuntimeException("Claim not found"));

        if (claim.getStatus() == ClaimStatus.REDEEMED) {
            throw new RuntimeException("Cannot cancel a redeemed claim");
        }

        if (claim.getStatus() == ClaimStatus.CANCELED) {
            throw new RuntimeException("Claim already canceled");
        }

        FoodListing listing = listingRepo.findById(claim.getListingId())
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        // Restore quantity
        listing.setRemainingQuantity(listing.getRemainingQuantity() + claim.getQuantity());
        listingRepo.save(listing);

        // Update claim status
        claim.setStatus(ClaimStatus.CANCELED);
        return claimRepo.save(claim);
    }
}
