# Snake Game - Ã∞≥‘…ﬂ

A web-based Snake game with Java backend (zero external dependencies).

## Quick Start

```bash
# Compile
javac -encoding UTF-8 -d build src/main/java/com/zdapao509/App.java

# Run
java -cp build com.zdapao509.App

# Or use Maven
mvn compile
mvn exec:java -Dexec.mainClass="com.zdapao509.App"
```

Open http://localhost:8080 to play.

## Controls

| Action | Key |
|--------|-----|
| Move | Arrow Keys / WASD |
| Pause | P |
| Start / Restart | Space |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/config | Game configuration |
| GET | /api/scores?limit=10 | Leaderboard |
| POST | /api/scores | Submit score |

## Project Structure

```
©¿©§©§ pom.xml
©∏©§©§ src/main/
    ©¿©§©§ java/com/zdapao509/
    ©¶   ©∏©§©§ App.java           # HTTP server + game logic
    ©∏©§©§ resources/static/
        ©¿©§©§ index.html          # Game page
        ©¿©§©§ css/style.css       # Styles
        ©∏©§©§ js/game.js          # Snake game (Canvas)
```
