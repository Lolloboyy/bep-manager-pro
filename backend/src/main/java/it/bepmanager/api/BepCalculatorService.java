package it.bepmanager.api;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BepCalculatorService {
    public AnalysisResponse calculate(AnalysisRequest request) {
        if (request == null) throw new IllegalArgumentException("Richiesta mancante.");
        if (!Double.isFinite(request.fixedCosts()) || request.fixedCosts() < 0) {
            throw new IllegalArgumentException("I costi fissi devono essere un numero positivo o zero.");
        }
        if (!Double.isFinite(request.targetProfit()) || request.targetProfit() < 0) {
            throw new IllegalArgumentException("L'utile obiettivo deve essere un numero positivo o zero.");
        }
        List<ProductInput> products = request.products();
        if (products == null || products.isEmpty()) {
            throw new IllegalArgumentException("Inserire almeno un prodotto o servizio.");
        }

        double totalUnits = 0;
        double totalRevenue = 0;
        double totalVariableCosts = 0;
        for (ProductInput product : products) {
            validateProduct(product);
            totalUnits += product.plannedUnits();
            totalRevenue += product.price() * product.plannedUnits();
            totalVariableCosts += product.variableCost() * product.plannedUnits();
        }

        double totalContribution = totalRevenue - totalVariableCosts;
        double weightedContribution = totalUnits > 0 ? totalContribution / totalUnits : 0;
        double contributionRatio = totalRevenue > 0 ? totalContribution / totalRevenue : 0;
        double averagePrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;
        double averageVariableCost = totalUnits > 0 ? totalVariableCosts / totalUnits : 0;
        boolean feasible = totalUnits > 0 && weightedContribution > 0 && contributionRatio > 0;

        Double bepUnits = feasible ? request.fixedCosts() / weightedContribution : null;
        Long bepUnitsRounded = bepUnits == null ? null : (long) Math.ceil(bepUnits);
        Double bepRevenue = feasible ? request.fixedCosts() / contributionRatio : null;
        double profit = totalContribution - request.fixedCosts();
        Double safetyUnits = bepUnits == null ? null : totalUnits - bepUnits;
        Double safetyPercent = safetyUnits == null || totalUnits <= 0 ? null : safetyUnits / totalUnits * 100.0;
        Double targetUnits = feasible ? (request.fixedCosts() + request.targetProfit()) / weightedContribution : null;
        Long targetUnitsRounded = targetUnits == null ? null : (long) Math.ceil(targetUnits);

        final double finalTotalUnits = totalUnits;
        final Double finalBepUnits = bepUnits;
        List<ProductResult> productResults = products.stream().map(product -> {
            double contributionPerUnit = product.price() - product.variableCost();
            double mix = finalTotalUnits > 0 ? product.plannedUnits() / finalTotalUnits : 0;
            return new ProductResult(
                    product.id(), product.name(), product.plannedUnits(), contributionPerUnit,
                    mix * 100.0,
                    product.price() * product.plannedUnits(),
                    product.variableCost() * product.plannedUnits(),
                    contributionPerUnit * product.plannedUnits(),
                    finalBepUnits == null ? null : finalBepUnits * mix
            );
        }).toList();

        return new AnalysisResponse(
                request.fixedCosts(), request.targetProfit(), totalUnits, totalRevenue,
                totalVariableCosts, totalContribution, weightedContribution,
                contributionRatio, averagePrice, averageVariableCost,
                bepUnits, bepUnitsRounded, bepRevenue, profit,
                safetyUnits, safetyPercent, targetUnits, targetUnitsRounded,
                feasible, productResults
        );
    }

    private void validateProduct(ProductInput product) {
        if (product == null) throw new IllegalArgumentException("Una voce prodotto è vuota.");
        if (product.name() == null || product.name().isBlank()) {
            throw new IllegalArgumentException("Ogni prodotto deve avere un nome.");
        }
        if (!finiteNonNegative(product.price()) || !finiteNonNegative(product.variableCost())
                || !finiteNonNegative(product.plannedUnits())) {
            throw new IllegalArgumentException("Prezzi, costi variabili e quantità devono essere numeri positivi o zero.");
        }
    }

    private boolean finiteNonNegative(double value) {
        return Double.isFinite(value) && value >= 0;
    }
}
