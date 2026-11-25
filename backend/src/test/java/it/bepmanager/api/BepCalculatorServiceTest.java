package it.bepmanager.api;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BepCalculatorServiceTest {
    private final BepCalculatorService calculator = new BepCalculatorService();

    @Test
    void calculatesSingleProductBreakEvenPoint() {
        AnalysisRequest request = new AnalysisRequest(3000, 1000,
                List.of(new ProductInput("p1", "Prodotto", 20, 8, 300)));
        AnalysisResponse result = calculator.calculate(request);
        assertEquals(250, result.bepUnitsExact(), 0.0001);
        assertEquals(5000, result.bepRevenue(), 0.0001);
        assertEquals(600, result.profit(), 0.0001);
        assertEquals(334, result.targetProfitUnitsRounded());
    }

    @Test
    void calculatesWeightedContributionForProductMix() {
        AnalysisRequest request = new AnalysisRequest(4800, 2500, List.of(
                new ProductInput("a", "A", 25, 10, 150),
                new ProductInput("b", "B", 40, 18, 80),
                new ProductInput("c", "C", 80, 30, 30)
        ));
        AnalysisResponse result = calculator.calculate(request);
        assertEquals(5510, result.totalContribution(), 0.0001);
        assertEquals(710, result.profit(), 0.0001);
        assertTrue(result.bepUnitsExact() > 226 && result.bepUnitsExact() < 227);
    }

    @Test
    void marksBreakEvenAsNotReachableWhenContributionIsNotPositive() {
        AnalysisRequest request = new AnalysisRequest(1000, 500,
                List.of(new ProductInput("p1", "Prodotto", 10, 12, 100)));
        AnalysisResponse result = calculator.calculate(request);
        assertFalse(result.isFeasible());
        assertNull(result.bepUnitsExact());
    }
}
