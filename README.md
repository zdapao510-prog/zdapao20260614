# Snake Game - Ã∞≥‘…ﬂ

Web-based Snake game with Java backend + H2 SQL database.

## Quick Start (no Maven)

```bash
# Download H2 driver (once)
curl -sL -o lib/h2-2.2.224.jar https://repo1.maven.org/maven2/com/h2database/h2/2.2.224/h2-2.2.224.jar

# Compile
javac -encoding UTF-8 -cp "lib/h2-2.2.224.jar" -d build src/main/java/com/zdapao509/App.java

# Run
java -cp "build;lib/h2-2.2.224.jar" com.zdapao509.App
```

Open http://localhost:8080 to play.

## Using Maven

```bash
mvn compile
mvn exec:java -Dexec.mainClass="com.zdapao509.App"
```

## Controls

| Action | Key |
|--------|-----|
| Move | Arrow Keys / WASD |
| Pause | P |
| Start / Restart | Space |

## Persistence

Scores are stored in **H2 database** (`data/snakegame.mv.db`), survives restarts.
