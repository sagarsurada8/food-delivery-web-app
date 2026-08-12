package com.food.backend.config;

import com.food.backend.model.Food;
import com.food.backend.model.User;
import com.food.backend.repository.FoodRepository;
import com.food.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed food items if empty
        if (foodRepository.count() == 0) {
            Food f1 = new Food(null, "Margherita Pizza", "Classic tomato sauce, fresh mozzarella cheese, and fresh basil leaves on our signature hand-tossed crust.", 12.99, "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60", "Pizza", true);
            Food f2 = new Food(null, "Pepperoni Feast", "Generous layers of premium spicy pepperoni, melted mozzarella, and oregano, baked to bubbly perfection.", 14.99, "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60", "Pizza", false);
            Food f3 = new Food(null, "Garden Fresh Veggie", "Bell peppers, sweet corn, black olives, onions, mushrooms, and cherry tomatoes, sprinkled with parmesan.", 13.49, "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=60", "Pizza", true);
            
            Food f4 = new Food(null, "Classic Cheese Burger", "Juicy fire-grilled beef patty topped with melted cheddar, lettuce, fresh tomatoes, pickles, and our house sauce on a toasted brioche bun.", 8.99, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60", "Burgers", false);
            Food f5 = new Food(null, "Crispy Paneer Burger", "Spicy battered paneer patty, coleslaw, sliced onions, and premium mint mayo inside a toasted soft bun.", 7.99, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=60", "Burgers", true);
            Food f6 = new Food(null, "Smoky BBQ Burger", "Double fire-grilled chicken patty loaded with smoky BBQ sauce, crispy onion rings, cheddar cheese, and jalapeños.", 10.49, "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60", "Burgers", false);

            Food f7 = new Food(null, "Teriyaki Chicken Bowl", "Tender chicken chunks glazed in authentic sweet teriyaki sauce, served over hot jasmine rice with steamed broccoli and sesame seeds.", 11.99, "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60", "Asian", false);
            Food f8 = new Food(null, "Spicy Schezwan Noodles", "Wok-tossed noodles with colorful mixed bell peppers, carrots, spring onions, and a punchy, spicy Schezwan sauce.", 9.49, "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60", "Asian", true);

            Food f9 = new Food(null, "Chocolate Lava Cake", "Warm chocolate cake with a molten liquid chocolate center, served with a dusting of powdered sugar.", 5.99, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60", "Desserts", true);
            Food f10 = new Food(null, "New York Cheesecake", "Rich, creamy, and smooth baked cheesecake slice topped with fresh raspberry compote.", 6.49, "https://images.unsplash.com/photo-1524351199679-46cddf530c04?w=500&auto=format&fit=crop&q=60", "Desserts", true);

            Food f11 = new Food(null, "Fresh Mint Mojito", "A refreshing blend of lime, fresh mint leaves, white cane sugar, and sparkling club soda over crushed ice.", 4.49, "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60", "Beverages", true);
            Food f12 = new Food(null, "Iced Salted Caramel Latte", "Rich espresso blended with milk and sweet salted caramel syrup, served over ice and topped with cold foam.", 4.99, "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60", "Beverages", true);

            foodRepository.saveAll(Arrays.asList(f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12));
            System.out.println(">>> Seeded 12 default food items successfully.");
        }

        // 2. Seed a default admin user if none exists
        if (userRepository.count() == 0) {
            User admin = new User(null, "Admin Sagar", "admin@foodexpress.com", "admin123", "ADMIN");
            User customer = new User(null, "John Doe", "john@gmail.com", "password123", "CUSTOMER");
            userRepository.saveAll(Arrays.asList(admin, customer));
            System.out.println(">>> Seeded default users successfully: Admin (admin@foodexpress.com / admin123) and Customer (john@gmail.com / password123)");
        }
    }
}
