package com.unibite.project.listings;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "food_listings")
public class FoodListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long restaurantId;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private int totalQuantity;

    @Column(nullable = false)
    private int remainingQuantity;

    @Column(nullable = false)
    private int perPersonLimit;

    private String pickupLocation;

    private Instant availableUntil;

    private Instant createdAt = Instant.now();

    public FoodListing() {}

    public Long getId() { return id; }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getTotalQuantity() { return totalQuantity; }
    public void setTotalQuantity(int totalQuantity) { this.totalQuantity = totalQuantity; }

    public int getRemainingQuantity() { return remainingQuantity; }
    public void setRemainingQuantity(int remainingQuantity) { this.remainingQuantity = remainingQuantity; }

    public int getPerPersonLimit() { return perPersonLimit; }
    public void setPerPersonLimit(int perPersonLimit) { this.perPersonLimit = perPersonLimit; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public Instant getAvailableUntil() { return availableUntil; }
    public void setAvailableUntil(Instant availableUntil) { this.availableUntil = availableUntil; }

    public Instant getCreatedAt() { return createdAt; }
}