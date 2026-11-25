package it.bepmanager.api;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/scenarios")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"})
public class ScenarioController {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final BepCalculatorService calculator;

    public ScenarioController(JdbcTemplate jdbc, ObjectMapper mapper, BepCalculatorService calculator) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.calculator = calculator;
    }

    @GetMapping
    public List<SavedScenario> list() {
        return jdbc.query("SELECT id, payload FROM scenarios ORDER BY created_at DESC", (rs, rowNum) -> {
            try {
                SavedScenario stored = mapper.readValue(rs.getString("payload"), SavedScenario.class);
                return new SavedScenario(rs.getLong("id"), stored.name(), stored.createdAt(), stored.request(), stored.result());
            } catch (JacksonException exception) {
                throw new IllegalStateException("Impossibile leggere uno scenario salvato.", exception);
            }
        });
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavedScenario save(@RequestBody SaveScenarioRequest body) {
        if (body == null || body.request() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dati dello scenario mancanti.");
        }
        AnalysisResponse result = calculator.calculate(body.request());
        String candidateName = body.name() == null || body.name().isBlank() ? "Analisi senza titolo" : body.name().trim();
        final String name = candidateName.length() > 100 ? candidateName.substring(0, 100) : candidateName;
        Instant createdAt = Instant.now();
        SavedScenario preliminary = new SavedScenario(null, name, createdAt, body.request(), result);
        final String json;
        try {
            json = mapper.writeValueAsString(preliminary);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Impossibile preparare lo scenario.", exception);
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO scenarios(name, created_at, payload) VALUES (?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, name);
            statement.setTimestamp(2, Timestamp.from(createdAt));
            statement.setString(3, json);
            return statement;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) throw new IllegalStateException("Il database non ha restituito l'identificativo dello scenario.");
        long id = key.longValue();
        SavedScenario saved = new SavedScenario(id, name, createdAt, body.request(), result);
        try {
            jdbc.update("UPDATE scenarios SET payload = ? WHERE id = ?", mapper.writeValueAsString(saved), id);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Impossibile completare il salvataggio dello scenario.", exception);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        int deleted = jdbc.update("DELETE FROM scenarios WHERE id = ?", id);
        if (deleted == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Scenario non trovato.");
    }
}
