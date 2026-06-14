package com.zdapao509;

import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class AppTest {
    @Test void serviceStoresScores() {
        App.GameService service = new App.GameService();
        service.submitScore(new App.ScoreEntry("test", 100, 5));
        assertEquals(1, service.getTopScores(10).size());
        assertEquals(100, service.getTopScores(10).get(0).score);
    }
    @Test void serviceReturnsOrderedScores() {
        App.GameService service = new App.GameService();
        service.submitScore(new App.ScoreEntry("p1", 50, 5));
        service.submitScore(new App.ScoreEntry("p2", 200, 10));
        service.submitScore(new App.ScoreEntry("p3", 100, 7));
        List<App.ScoreEntry> top = service.getTopScores(10);
        assertEquals(200, top.get(0).score);
        assertEquals(100, top.get(1).score);
        assertEquals(50, top.get(2).score);
    }
}
