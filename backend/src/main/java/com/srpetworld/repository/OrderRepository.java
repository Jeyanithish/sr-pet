package com.srpetworld.repository;

import com.srpetworld.entity.Order;
import com.srpetworld.entity.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"items", "items.bird", "payment"})
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"items", "items.bird", "payment"})
    List<Order> findAllByOrderByCreatedAtDesc();

    Optional<Order> findByOrderCode(String orderCode);

    @EntityGraph(attributePaths = {"items", "items.bird", "payment"})
    Optional<Order> findByOrderCodeAndUserId(String orderCode, Long userId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<OrderStatus> statuses);

    @EntityGraph(attributePaths = {"items", "items.bird"})
    @Query("SELECT o FROM Order o WHERE o.status IN :statuses AND o.createdAt >= :since ORDER BY o.createdAt ASC")
    List<Order> findCompletedOrdersSince(@Param("statuses") List<OrderStatus> statuses,
                                         @Param("since") LocalDateTime since);

    @EntityGraph(attributePaths = {"items", "items.bird"})
    @Query("SELECT o FROM Order o WHERE o.status IN :statuses ORDER BY o.createdAt ASC")
    List<Order> findAllCompletedOrders(@Param("statuses") List<OrderStatus> statuses);
}
