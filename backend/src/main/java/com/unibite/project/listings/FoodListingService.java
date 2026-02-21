package com.unibite.project.listings;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodListingService {

    private final FoodListingRepository listingRepo;

    public FoodListingService(FoodListingRepository listingRepo) {
        this.listingRepo = listingRepo;
    }

    public FoodListing create(FoodListing listing) {
        if (listing.getRestaurantId() == null) {
            throw new RuntimeException("restaurantId is required");
        }
        if (listing.getTitle() == null || listing.getTitle().isBlank()) {
            throw new RuntimeException("title is required");
        }
        if (listing.getTotalQuantity() <= 0) {
            throw new RuntimeException("totalQuantity must be > 0");
        }
        if (listing.getPerPersonLimit() <= 0) {
            throw new RuntimeException("perPersonLimit must be > 0");
        }

        listing.setRemainingQuantity(listing.getTotalQuantity());

        return listingRepo.save(listing);
    }

    public List<FoodListing> getAll() {
        return listingRepo.findAll();
    }

    public List<FoodListing> getByRestaurant(Long restaurantId) {
        return listingRepo.findByRestaurantId(restaurantId);
    }
}