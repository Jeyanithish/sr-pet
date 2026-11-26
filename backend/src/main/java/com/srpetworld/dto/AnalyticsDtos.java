package com.srpetworld.dto;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsDtos {

    public record RevenuePointDto(
            String label,
            BigDecimal revenueInr,
            long ordersCount
    ) {}

    public record SpeciesShareDto(
            String category,
            BigDecimal revenueInr,
            long unitsSold
    ) {}

    public record StockVsSoldDto(
            String category,
            long availableStock,
            long unitsSold
    ) {}

    public record AnalyticsSummaryDto(
            BigDecimal totalRevenue,
            long totalOrders,
            long activeOrders,
            long totalStock,
            BigDecimal avgOrderValue,
            List<RevenuePointDto> revenueTrend,
            List<SpeciesShareDto> speciesShare,
            List<StockVsSoldDto> stockVsSold
    ) {}
}
