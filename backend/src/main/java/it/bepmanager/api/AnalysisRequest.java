package it.bepmanager.api;

import java.util.List;

public record AnalysisRequest(
        double fixedCosts,
        double targetProfit,
        List<ProductInput> products
) { }
