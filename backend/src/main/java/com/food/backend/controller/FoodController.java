package com.food.backend.controller;

import com.food.backend.model.Food;
import com.food.backend.repository.FoodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
@CrossOrigin
public class FoodController {

    @Autowired
    private FoodRepository foodRepository;

    @GetMapping
    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    @GetMapping("/category/{category}")
    public List<Food> getFoodsByCategory(@PathVariable String category) {
        return foodRepository.findByCategory(category);
    }

    @PostMapping
    public ResponseEntity<Food> addFood(@RequestBody Food food) {
        Food savedFood = foodRepository.save(food);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedFood);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFood(@PathVariable Long id) {
        if (!foodRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        foodRepository.deleteById(id);
        return ResponseEntity.ok("Food item deleted successfully!");
    }
}
