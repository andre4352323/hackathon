package com.unibite.project.listings;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class FoodListingController {

    private final FoodListingService listingService;

    public FoodListingController(FoodListingService listingService) {
        this.listingService = listingService;
    }

    @PostMapping
    public FoodListing create(@RequestBody FoodListing listing) {
        return listingService.create(listing);
    }

    @GetMapping
    public List<FoodListing> getAll() {
        return listingService.getAll();
    }

    @GetMapping("/restaurant/{restaurantId}")
    public List<FoodListing> getByRestaurant(@PathVariable Long restaurantId) {
        return listingService.getByRestaurant(restaurantId);
    }
}