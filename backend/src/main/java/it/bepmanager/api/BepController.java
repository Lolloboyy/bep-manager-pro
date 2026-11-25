package it.bepmanager.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"})
public class BepController {
    private final BepCalculatorService calculator;

    public BepController(BepCalculatorService calculator) {
        this.calculator = calculator;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "UP", "application", "BEP Manager Pro API", "version", "1.0.0");
    }

    @PostMapping("/analysis")
    public AnalysisResponse analyze(@RequestBody AnalysisRequest request) {
        return calculator.calculate(request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleInvalidInput(IllegalArgumentException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", exception.getMessage()));
    }
}
