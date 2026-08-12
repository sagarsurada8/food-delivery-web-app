package com.food.backend.repository;

import com.food.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByOrderTimeDesc(Long userId);
    List<Order> findAllByOrderByOrderTimeDesc();
}
