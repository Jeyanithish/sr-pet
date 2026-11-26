package com.srpetworld.service;

import com.srpetworld.dto.AnalyticsDtos.*;
import com.srpetworld.entity.Bird;
import com.srpetworld.entity.Order;
import com.srpetworld.entity.OrderItem;
import com.srpetworld.entity.OrderStatus;
import com.srpetworld.repository.BirdRepository;
import com.srpetworld.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AnalyticsService {

    private static final List<OrderStatus> COMPLETED_STATUSES = List.of(
            OrderStatus.CONFIRMED,
            OrderStatus.READY,
            OrderStatus.DELIVERED
    );

    private static final List<OrderStatus> ACTIVE_STATUSES = List.of(
            OrderStatus.CONFIRMED,
            OrderStatus.READY
    );

    private final OrderRepository orderRepository;
    private final BirdRepository birdRepository;

    public AnalyticsService(OrderRepository orderRepository, BirdRepository birdRepository) {
        this.orderRepository = orderRepository;
        this.birdRepository = birdRepository;
    }

    public AnalyticsSummaryDto getSummary(String range) {
        boolean isSixMonths = "6m".equalsIgnoreCase(range);
        LocalDateTime since = isSixMonths
                ? LocalDate.now().minusMonths(5).withDayOfMonth(1).atStartOfDay()
                : LocalDate.now().minusDays(6).atStartOfDay();

        List<Order> allCompleted = orderRepository.findAllCompletedOrders(COMPLETED_STATUSES);
        List<Order> rangeOrders = orderRepository.findCompletedOrdersSince(COMPLETED_STATUSES, since);
        List<Bird> allBirds = birdRepository.findAllByOrderByIdAsc();

        BigDecimal totalRevenue = allCompleted.stream()
                .map(Order::getTotalInr)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalOrders = allCompleted.size();
        long activeOrders = orderRepository.countByStatusIn(ACTIVE_STATUSES);
        long totalStock = allBirds.stream()
                .filter(b -> Boolean.TRUE.equals(b.getActive()))
                .mapToLong(Bird::getStockQuantity)
                .sum();

        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<RevenuePointDto> revenueTrend = isSixMonths
                ? buildMonthlyTrend(rangeOrders)
                : buildDailyTrend(rangeOrders);

        List<SpeciesShareDto> speciesShare = buildSpeciesShare(allCompleted);
        List<StockVsSoldDto> stockVsSold = buildStockVsSold(allBirds);

        return new AnalyticsSummaryDto(
                totalRevenue,
                totalOrders,
                activeOrders,
                totalStock,
                avgOrderValue,
                revenueTrend,
                speciesShare,
                stockVsSold
        );
    }

    private List<RevenuePointDto> buildDailyTrend(List<Order> orders) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM", Locale.ENGLISH);
        Map<LocalDate, BigDecimal> revenueMap = new LinkedHashMap<>();
        Map<LocalDate, Long> countMap = new LinkedHashMap<>();

        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            revenueMap.put(d, BigDecimal.ZERO);
            countMap.put(d, 0L);
        }

        for (Order o : orders) {
            LocalDate d = o.getCreatedAt().toLocalDate();
            if (revenueMap.containsKey(d)) {
                revenueMap.put(d, revenueMap.get(d).add(o.getTotalInr()));
                countMap.put(d, countMap.get(d) + 1);
            }
        }

        return revenueMap.keySet().stream()
                .map(d -> new RevenuePointDto(d.format(fmt), revenueMap.get(d), countMap.get(d)))
                .toList();
    }

    private List<RevenuePointDto> buildMonthlyTrend(List<Order> orders) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yy", Locale.ENGLISH);
        Map<YearMonth, BigDecimal> revenueMap = new LinkedHashMap<>();
        Map<YearMonth, Long> countMap = new LinkedHashMap<>();

        YearMonth current = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            revenueMap.put(ym, BigDecimal.ZERO);
            countMap.put(ym, 0L);
        }

        for (Order o : orders) {
            YearMonth ym = YearMonth.from(o.getCreatedAt());
            if (revenueMap.containsKey(ym)) {
                revenueMap.put(ym, revenueMap.get(ym).add(o.getTotalInr()));
                countMap.put(ym, countMap.get(ym) + 1);
            }
        }

        return revenueMap.keySet().stream()
                .map(ym -> new RevenuePointDto(ym.format(fmt), revenueMap.get(ym), countMap.get(ym)))
                .toList();
    }

    private List<SpeciesShareDto> buildSpeciesShare(List<Order> orders) {
        Map<String, BigDecimal> revByCategory = new LinkedHashMap<>();
        Map<String, Long> unitsByCategory = new LinkedHashMap<>();

        for (Order o : orders) {
            for (OrderItem item : o.getItems()) {
                String cat = item.getBird().getCategory();
                BigDecimal lineTotal = item.getUnitPriceInr().multiply(BigDecimal.valueOf(item.getQuantity()));
                revByCategory.merge(cat, lineTotal, BigDecimal::add);
                unitsByCategory.merge(cat, (long) item.getQuantity(), Long::sum);
            }
        }

        return revByCategory.keySet().stream()
                .map(cat -> new SpeciesShareDto(cat, revByCategory.get(cat), unitsByCategory.get(cat)))
                .toList();
    }

    private List<StockVsSoldDto> buildStockVsSold(List<Bird> birds) {
        Map<String, Long> stockMap = new LinkedHashMap<>();
        Map<String, Long> soldMap = new LinkedHashMap<>();

        for (Bird b : birds) {
            stockMap.merge(b.getCategory(), (long) b.getStockQuantity(), Long::sum);
            soldMap.merge(b.getCategory(), (long) b.getUnitsSold(), Long::sum);
        }

        return stockMap.keySet().stream()
                .map(cat -> new StockVsSoldDto(cat, stockMap.get(cat), soldMap.get(cat)))
                .toList();
    }
}
