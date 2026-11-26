package com.srpetworld.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bird_id", nullable = false)
    private Bird bird;

    @Column(name = "bird_name_snapshot", nullable = false, length = 150)
    private String birdNameSnapshot;

    @Column(name = "unit_price_inr", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPriceInr;

    @Column(nullable = false)
    private Integer quantity;

    public OrderItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Bird getBird() { return bird; }
    public void setBird(Bird bird) { this.bird = bird; }

    public String getBirdNameSnapshot() { return birdNameSnapshot; }
    public void setBirdNameSnapshot(String birdNameSnapshot) { this.birdNameSnapshot = birdNameSnapshot; }

    public BigDecimal getUnitPriceInr() { return unitPriceInr; }
    public void setUnitPriceInr(BigDecimal unitPriceInr) { this.unitPriceInr = unitPriceInr; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
