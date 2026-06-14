package com.zdapao509;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

public class App {

    // ======================== Model ========================
    static class ScoreEntry {
        String playerName;
        int score;
        int length;
        LocalDateTime timestamp;

        ScoreEntry() { this.timestamp = LocalDateTime.now(); }

        ScoreEntry(String playerName, int score, int length) {
            this.playerName = playerName;
            this.score = score;
            this.length = length;
            this.timestamp = LocalDateTime.now();
        }

        String toJson() {
            return "{\"playerName\":\"" + escapeJson(playerName)
                + "\",\"score\":" + score
                + ",\"length\":" + length
                + ",\"timestamp\":\"" + timestamp + "\"}";
        }
    }

    // ======================== Database ========================
    static class DatabaseService {
        private static final String DB_URL = "jdbc:h2:file:./data/snakegame;AUTO_SERVER=TRUE";

        DatabaseService() throws Exception {
            Class.forName("org.h2.Driver");
            try (Connection conn = getConnection();
                 Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE TABLE IF NOT EXISTS scores (" +
                    "id INT AUTO_INCREMENT PRIMARY KEY," +
                    "player_name VARCHAR(100) NOT NULL," +
                    "score INT NOT NULL," +
                    "snake_length INT NOT NULL," +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");
                System.out.println("DB: Table ready");
            }
        }

        Connection getConnection() throws SQLException {
            return DriverManager.getConnection(DB_URL, "sa", "");
        }

        synchronized void submitScore(ScoreEntry entry) {
            String sql = "INSERT INTO scores (player_name, score, snake_length) VALUES (?, ?, ?)";
            try (Connection conn = getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, entry.playerName);
                ps.setInt(2, entry.score);
                ps.setInt(3, entry.length);
                ps.executeUpdate();
            } catch (SQLException e) {
                System.err.println("DB insert error: " + e.getMessage());
            }
        }

        synchronized List<ScoreEntry> getTopScores(int limit) {
            List<ScoreEntry> result = new ArrayList<>();
            String sql = "SELECT player_name, score, snake_length, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?";
            try (Connection conn = getConnection();
                 PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, limit);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        ScoreEntry e = new ScoreEntry();
                        e.playerName = rs.getString("player_name");
                        e.score = rs.getInt("score");
                        e.length = rs.getInt("snake_length");
                        Timestamp ts = rs.getTimestamp("created_at");
                        e.timestamp = ts != null ? ts.toLocalDateTime() : LocalDateTime.now();
                        result.add(e);
                    }
                }
            } catch (SQLException e) {
                System.err.println("DB query error: " + e.getMessage());
            }
            return result;
        }
    }

    static final DatabaseService db;

    static {
        try {
            db = new DatabaseService();
        } catch (Exception e) {
            throw new RuntimeException("Failed to init database", e);
        }
    }

    static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // ======================== Main ========================
    public static void main(String[] args) throws Exception {
        int port = Integer.parseInt(System.getProperty("server.port", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/config", new ConfigHandler());
        server.createContext("/api/scores", new ScoresHandler());
        server.createContext("/", new StaticHandler());

        server.setExecutor(java.util.concurrent.Executors.newFixedThreadPool(4));
        server.start();

        System.out.println("=== Snake Game ===");
        System.out.println("DB: data/snakegame.mv.db");
        System.out.println("Server started on http://localhost:" + port);
    }

    // ======================== Handlers ========================
    static class ConfigHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCors(exchange);
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(405, -1);
                return;
            }
            String json = "{\"boardWidth\":20,\"boardHeight\":20,\"initialSpeed\":150,\"cellSize\":25}";
            sendJson(exchange, 200, json);
        }
    }

    static class ScoresHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCors(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("GET".equals(method)) {
                String query = exchange.getRequestURI().getQuery();
                int limit = 10;
                if (query != null && query.startsWith("limit=")) {
                    try { limit = Integer.parseInt(query.substring(6)); } catch (Exception ignored) {}
                }
                List<ScoreEntry> scores = db.getTopScores(limit);
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < scores.size(); i++) {
                    if (i > 0) sb.append(",");
                    sb.append(scores.get(i).toJson());
                }
                sb.append("]");
                sendJson(exchange, 200, sb.toString());

            } else if ("POST".equals(method)) {
                String body = readBody(exchange);
                String name = extractJsonString(body, "playerName");
                int score = extractJsonInt(body, "score");
                int length = extractJsonInt(body, "length");
                if (name == null || name.isEmpty()) name = "Anonymous";
                db.submitScore(new ScoreEntry(name, score, length));
                sendJson(exchange, 200, "{\"status\":\"ok\"}");

            } else if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    static class StaticHandler implements HttpHandler {
        private static final String[] STATIC_ROOTS = {
            "src/main/resources/static",
            "E:/zdapao0614/src/main/resources/static"
        };

        private static final Map<String, String> MIME_TYPES = new HashMap<>();
        static {
            MIME_TYPES.put("html", "text/html; charset=utf-8");
            MIME_TYPES.put("css", "text/css; charset=utf-8");
            MIME_TYPES.put("js", "application/javascript; charset=utf-8");
            MIME_TYPES.put("png", "image/png");
            MIME_TYPES.put("jpg", "image/jpeg");
            MIME_TYPES.put("svg", "image/svg+xml");
            MIME_TYPES.put("ico", "image/x-icon");
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCors(exchange);
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) path = "/index.html";

            for (String root : STATIC_ROOTS) {
                Path filePath = Paths.get(root, path);
                if (Files.exists(filePath) && !Files.isDirectory(filePath)) {
                    String ext = getExtension(path);
                    String mime = MIME_TYPES.getOrDefault(ext, "application/octet-stream");
                    exchange.getResponseHeaders().set("Content-Type", mime);
                    exchange.sendResponseHeaders(200, Files.size(filePath));
                    try (OutputStream os = exchange.getResponseBody()) {
                        Files.copy(filePath, os);
                    }
                    return;
                }
            }

            String error = "404 Not Found";
            byte[] errorBytes = error.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(404, errorBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(errorBytes);
            }
        }

        String getExtension(String path) {
            int idx = path.lastIndexOf('.');
            return idx > 0 ? path.substring(idx + 1).toLowerCase() : "";
        }
    }

    // ======================== Helpers ========================
    static void setCors(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    static void sendJson(HttpExchange exchange, int code, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    static String extractJsonString(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start < 0) return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : null;
    }

    static int extractJsonInt(String json, String key) {
        String search = "\"" + key + "\":";
        int start = json.indexOf(search);
        if (start < 0) return 0;
        start += search.length();
        int end = json.indexOf(",", start);
        if (end < 0) end = json.indexOf("}", start);
        if (end < 0) end = json.indexOf("]", start);
        if (end < 0) return 0;
        try { return Integer.parseInt(json.substring(start, end).trim()); }
        catch (NumberFormatException e) { return 0; }
    }
}
