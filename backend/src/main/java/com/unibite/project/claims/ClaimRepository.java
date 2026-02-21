package com.unibite.project.claims;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByStudentId(Long studentId);
    List<Claim> findByListingId(Long listingId);
    Optional<Claim> findByQrToken(String qrToken);
    Optional<Claim> findFirstByStudentIdAndStatusOrderByClaimedAtDesc(Long studentId, ClaimStatus status);
}
