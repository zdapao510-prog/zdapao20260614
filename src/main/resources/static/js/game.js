const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
const CELL = 25, COLS = 20, ROWS = 20;

const state = {
    snake: [], food: null, dir: DIR.RIGHT, nextDir: DIR.RIGHT,
    score: 0, highScore: parseInt(localStorage.getItem("snakeHighScore") || "0"),
    running: false, paused: false, gameOver: false, started: false, growing: false,
    tickId: null, speed: 150,
    particles: [], scorePopups: [], foodPulse: 0,
};

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = COLS * CELL; canvas.height = ROWS * CELL;

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlaySub = document.getElementById("overlay-sub");
const submitScoreDiv = document.getElementById("submit-score");
const submitMsg = document.getElementById("submit-msg");
const playerNameInput = document.getElementById("player-name");
const submitBtn = document.getElementById("submit-btn");
const startOverlay = document.getElementById("start-overlay");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const rankBody = document.getElementById("rank-body");
const speedVal = document.getElementById("speed-value");
const speedSlider = document.getElementById("speed-slider");

document.getElementById("btn-restart").onclick = restartGame;
document.getElementById("btn-pause").onclick = togglePause;
submitBtn.onclick = submitScore;

// === Speed Control ===
speedSlider.oninput = function () { setSpeed(parseInt(this.value)); };
document.querySelectorAll(".speed-btn").forEach(function (btn) {
    btn.onclick = function () {
        document.querySelectorAll(".speed-btn").forEach(function (b) { b.classList.remove("active"); });
        this.classList.add("active");
        setSpeed(parseInt(this.dataset.speed));
    };
});

function setSpeed(ms) {
    state.speed = ms;
    if (state.running) { clearInterval(state.tickId); state.tickId = setInterval(tick, state.speed); }
    speedVal.textContent = ms + "ms";
    speedSlider.value = ms;
}

// === Core Game ===
function initGame() {
    const midX = Math.floor(COLS / 2), midY = Math.floor(ROWS / 2);
    state.snake = [{ x: midX - 2, y: midY }, { x: midX - 1, y: midY }, { x: midX, y: midY }];
    state.dir = DIR.RIGHT; state.nextDir = DIR.RIGHT;
    state.score = 0; state.growing = false; state.gameOver = false; state.paused = false;
    state.particles = []; state.scorePopups = [];
    setSpeed(parseInt(speedSlider.value));
    spawnFood();
    updateScoreDisplay();
}

function spawnFood() {
    let pos;
    do { pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }; }
    while (state.snake.some(function (s) { return s.x === pos.x && s.y === pos.y; }));
    state.food = pos;
}

function tick() {
    if (state.paused || state.gameOver) return;
    state.dir = state.nextDir;
    const head = state.snake[state.snake.length - 1];
    var newHead;
    switch (state.dir) {
        case DIR.UP:    newHead = { x: head.x, y: head.y - 1 }; break;
        case DIR.DOWN:  newHead = { x: head.x, y: head.y + 1 }; break;
        case DIR.LEFT:  newHead = { x: head.x - 1, y: head.y }; break;
        case DIR.RIGHT: newHead = { x: head.x + 1, y: head.y }; break;
    }
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) { endGame(); return; }
    if (state.snake.some(function (s) { return s.x === newHead.x && s.y === newHead.y; })) { endGame(); return; }
    state.snake.push(newHead);
    if (newHead.x === state.food.x && newHead.y === state.food.y) {
        state.score++;
        spawnParticles(state.food.x, state.food.y);
        spawnScorePopup(state.food.x, state.food.y);
        updateScoreDisplay();
        spawnFood();
        if (state.score > state.highScore) { state.highScore = state.score; localStorage.setItem("snakeHighScore", String(state.highScore)); updateScoreDisplay(); }
    } else { state.snake.shift(); }
    draw();
}

function endGame() {
    state.gameOver = true; state.running = false; clearInterval(state.tickId); draw();
    overlayTitle.textContent = "Game Over";
    overlaySub.textContent = "Score: " + state.score + "  |  Press SPACE to restart";
    submitScoreDiv.classList.remove("hidden");
    submitMsg.classList.add("hidden");
    playerNameInput.value = "";
    submitBtn.disabled = false;
    overlay.classList.remove("hidden");
    fetchLeaderboard();
}

function restartGame() {
    clearInterval(state.tickId);
    overlay.classList.add("hidden");
    startOverlay.style.display = "none";
    initGame();
    state.running = true; state.started = true;
    state.tickId = setInterval(tick, state.speed);
    draw();
    fetchLeaderboard();
}

function togglePause() {
    if (!state.running || state.gameOver) return;
    state.paused = !state.paused;
    document.getElementById("btn-pause").textContent = state.paused ? "Resume" : "Pause";
    draw();
}

// === Particles & Popups ===
function spawnParticles(x, y) {
    var colors = ["#ff4757", "#ffd700", "#00e6b3", "#ff6b81", "#70a1ff", "#a29bfe"];
    for (var i = 0; i < 25; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = Math.random() * 5 + 2;
        state.particles.push({
            x: x * CELL + CELL / 2, y: y * CELL + CELL / 2,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 1.0, color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 4 + 2,
        });
    }
}

function spawnScorePopup(x, y) {
    state.scorePopups.push({ x: x * CELL + CELL / 2, y: y * CELL + CELL / 2, life: 1.0, text: "+1" });
}

function updateParticles() {
    for (var i = state.particles.length - 1; i >= 0; i--) {
        var p = state.particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.025;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (var j = state.scorePopups.length - 1; j >= 0; j--) {
        var sp = state.scorePopups[j];
        sp.y -= 1.2; sp.life -= 0.018;
        if (sp.life <= 0) state.scorePopups.splice(j, 1);
    }
}

// === Drawing ===
function draw() {
    if (state.running) updateParticles();
    state.foodPulse = (state.foodPulse + 0.05) % (Math.PI * 2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Grid
    ctx.strokeStyle = "#1e2d4a"; ctx.lineWidth = 0.5;
    for (var x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke(); }
    for (var y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke(); }
    // Particles
    for (var i = 0; i < state.particles.length; i++) {
        var p = state.particles[i];
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Food
    if (state.food) {
        var pulse = 0.85 + 0.15 * Math.sin(state.foodPulse);
        var fx = state.food.x * CELL + CELL / 2, fy = state.food.y * CELL + CELL / 2;
        var glowSize = CELL * 0.7 * pulse;
        ctx.shadowColor = "#ff4757"; ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = "#ff4757";
        ctx.beginPath(); ctx.arc(fx, fy, glowSize - 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ff6b81";
        ctx.beginPath(); ctx.arc(fx, fy, glowSize * 0.6 - 2, 0, Math.PI * 2); ctx.fill();
    }
    // Snake
    var len = state.snake.length;
    for (var i = 0; i < len; i++) {
        var seg = state.snake[i];
        var t = i / Math.max(len - 1, 1);
        var r = Math.round(0 + t * 20);
        var g = Math.round(212 - t * 80);
        var b = Math.round(170 - t * 60);
        var isHead = (i === len - 1);
        var px = seg.x * CELL + 1, py = seg.y * CELL + 1, sz = CELL - 2;
        ctx.shadowColor = isHead ? "#00e6b3" : "#00d4aa";
        ctx.shadowBlur = isHead ? 12 : (4 * (1 - t * 0.5));
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx.beginPath();
        ctx.roundRect(px, py, sz, sz, isHead ? 5 : 3);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (isHead) {
            ctx.fillStyle = "#0f0f23";
            ctx.beginPath(); ctx.arc(seg.x * CELL + CELL / 2 - 4, seg.y * CELL + CELL / 2 - 3, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(seg.x * CELL + CELL / 2 + 4, seg.y * CELL + CELL / 2 - 3, 3, 0, Math.PI * 2); ctx.fill();
        }
    }
    // Score popups
    for (var j = 0; j < state.scorePopups.length; j++) {
        var sp = state.scorePopups[j];
        ctx.globalAlpha = sp.life;
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(sp.text, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;
    // Pause overlay
    if (state.paused) {
        ctx.fillStyle = "rgba(15,15,35,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00d4aa"; ctx.font = "bold 36px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }
}

// === roundRect polyfill ===
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (r > w / 2) r = w / 2; if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r); return this;
    };
}

// === Input ===
document.addEventListener("keydown", function (e) {
    var key = e.key;
    if (key === " " || key === "Space") { e.preventDefault(); if (!state.started) { restartGame(); return; } if (state.gameOver) { restartGame(); return; } return; }
    if (key === "p" || key === "P") { togglePause(); return; }
    if (!state.running || state.paused) return;
    var newDir;
    switch (key) {
        case "ArrowUp": case "w": case "W": newDir = DIR.UP; break;
        case "ArrowDown": case "s": case "S": newDir = DIR.DOWN; break;
        case "ArrowLeft": case "a": case "A": newDir = DIR.LEFT; break;
        case "ArrowRight": case "d": case "D": newDir = DIR.RIGHT; break;
        default: return;
    }
    e.preventDefault();
    if ((state.dir === DIR.UP && newDir === DIR.DOWN) || (state.dir === DIR.DOWN && newDir === DIR.UP) ||
        (state.dir === DIR.LEFT && newDir === DIR.RIGHT) || (state.dir === DIR.RIGHT && newDir === DIR.LEFT)) return;
    state.nextDir = newDir;
});

// === API ===
async function submitScore() {
    var name = playerNameInput.value.trim() || "Anonymous";
    try {
        var res = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerName: name, score: state.score, length: state.snake.length }) });
        if (res.ok) { submitMsg.textContent = "Score submitted!"; submitMsg.classList.remove("hidden"); submitBtn.disabled = true; fetchLeaderboard(); }
        else { submitMsg.textContent = "Failed to submit"; submitMsg.classList.remove("hidden"); }
    } catch { submitMsg.textContent = "Cannot connect to server"; submitMsg.classList.remove("hidden"); }
}

async function fetchLeaderboard() {
    try {
        var res = await fetch("/api/scores");
        var data = await res.json();
        rankBody.innerHTML = data.map(function (s, i) { return "<tr><td>" + (i + 1) + "</td><td>" + escHtml(s.playerName) + "</td><td>" + s.score + "</td><td>" + s.length + "</td></tr>"; }).join("");
    } catch {}
}

function escHtml(s) { return String(s).replace(/[&<>"]/g, ""); }
function updateScoreDisplay() { scoreEl.textContent = state.score; highScoreEl.textContent = state.highScore; }

// === Init ===
initGame(); draw();
highScoreEl.textContent = state.highScore;
fetchLeaderboard();
