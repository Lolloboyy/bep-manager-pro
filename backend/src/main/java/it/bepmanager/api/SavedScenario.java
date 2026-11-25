package it.bepmanager.api;

import java.time.Instant;

public record SavedScenario(
        Long id,
        String name,
        Instant createdAt,
        AnalysisRequest request,
        AnalysisResponse result
) { }
