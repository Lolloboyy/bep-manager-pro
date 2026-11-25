package it.bepmanager.api;

public record ProductInput(
        String id,
        String name,
        double price,
        double variableCost,
        double plannedUnits
) { }
