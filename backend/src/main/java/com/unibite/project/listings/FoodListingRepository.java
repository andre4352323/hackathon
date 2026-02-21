package com.unibite.project.listings;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FoodListingRepository extends JpaRepository<FoodListing, Long> {
    List<FoodListing> findByRestaurantId(Long restaurantId);
}