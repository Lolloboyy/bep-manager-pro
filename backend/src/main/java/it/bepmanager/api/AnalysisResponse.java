package it.bepmanager.api;

import java.util.List;

public record AnalysisResponse(
        double fixedCosts,
        double targetProfit,
        double totalPlannedUnits,
        double totalRevenue,
        double totalVariableCosts,
        double totalContribution,
        double weightedContributionPerUnit,
        double contributionMarginRatio,
        double averagePrice,
        double averageVariableCost,
        Double bepUnitsExact,
        Long bepUnitsRounded,
        Double bepRevenue,
        double profit,
        Double marginOfSafetyUnits,
        Double marginOfSafetyPercent,
        Double targetProfitUnitsExact,
        Long targetProfitUnitsRounded,
        boolean isFeasible,
        List<ProductResult> productBreakdown
) { }
