package it.bepmanager.api;

public record ProductResult(
        String id,
        String name,
        double plannedUnits,
        double unitContribution,
        double salesMixPercent,
        double revenue,
        double variableCosts,
        double contribution,
        Double bepAllocatedUnits
) { }
