// === Game Constants ===
const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
const CELL = 25;
const COLS = 20, ROWS = 20;

// === Game State ===
let state = {
    snake: [],
    food: null,
    dir: DIR.RIGHT,
    nextDir: DIR.RIGHT,
    score: 0,
    highScore: parseInt(localStorage.getItem("snakeHighScore") || "0"),
    running: false,
    paused: false,
    gameOver: false,
    started: false,
    growing: false,
    tickId: null,
    speed: 150,
};

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

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

document.getElementById("btn-restart").onclick = restartGame;
document.getElementById("btn-pause").onclick = togglePause;
submitBtn.onclick = submitScore;

// === Core Functions ===

function initGame() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    state.snake = [
        { x: midX - 2, y: midY },
        { x: midX - 1, y: midY },
        { x: midX, y: midY },
    ];
    state.dir = DIR.RIGHT;
    state.nextDir = DIR.RIGHT;
    state.score = 0;
    state.growing = false;
    state.gameOver = false;
    state.paused = false;
    state.speed = 150;
    spawnFood();
    updateScoreDisplay();
}

function spawnFood() {
    let pos;
    do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (state.snake.some(s => s.x === pos.x && s.y === pos.y));
    state.food = pos;
}

function tick() {
    if (state.paused || state.gameOver) return;
    state.dir = state.nextDir;

    const head = state.snake[state.snake.length - 1];
    let newHead;
    switch (state.dir) {
        case DIR.UP:    newHead = { x: head.x, y: head.y - 1 }; break;
        case DIR.DOWN:  newHead = { x: head.x, y: head.y + 1 }; break;
        case DIR.LEFT:  newHead = { x: head.x - 1, y: head.y }; break;
        case DIR.RIGHT: newHead = { x: head.x + 1, y: head.y }; break;
        default: return;
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
        endGame();
        return;
    }

    // Self collision
    if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        endGame();
        return;
    }

    state.snake.push(newHead);

    if (newHead.x === state.food.x && newHead.y === state.food.y) {
        state.score++;
        state.speed = Math.max(60, state.speed - 2);
        updateScoreDisplay();
        spawnFood();
        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem("snakeHighScore", String(state.highScore));
            updateScoreDisplay();
        }
        clearInterval(state.tickId);
        state.tickId = setInterval(tick, state.speed);
    } else {
        state.snake.shift();
    }

    draw();
}

function endGame() {
    state.gameOver = true;
    state.running = false;
    clearInterval(state.tickId);
    draw();

    overlayTitle.textContent = "?? Game Over";
    overlaySub.textContent = "分数: " + state.score + "  |  按空格键重新开始";
    submitScoreDiv.classList.remove("hidden");
    submitMsg.classList.add("hidden");
    playerNameInput.value = "";
    overlay.classList.remove("hidden");
}

function restartGame() {
    clearInterval(state.tickId);
    overlay.classList.add("hidden");
    startOverlay.style.display = "none";
    initGame();
    state.running = true;
    state.started = true;
    state.tickId = setInterval(tick, state.speed);
    draw();
    fetchLeaderboard();
}

function togglePause() {
    if (!state.running || state.gameOver) return;
    state.paused = !state.paused;
    document.getElementById("btn-pause").textContent = state.paused ? "继续" : "暂停";
    if (!state.paused) draw();
}

// === Drawing ===

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "#1e2d4a";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ROWS * CELL); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(COLS * CELL, y * CELL); ctx.stroke();
    }

    // Food
    if (state.food) {
        const fx = state.food.x * CELL + CELL / 2;
        const fy = state.food.y * CELL + CELL / 2;
        ctx.fillStyle = "#ff4757";
        ctx.shadowColor = "#ff4757";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(fx, fy, CELL / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Snake
    state.snake.forEach((seg, i) => {
        const px = seg.x * CELL + 1;
        const py = seg.y * CELL + 1;
        const sz = CELL - 2;
        const isHead = i === state.snake.length - 1;

        ctx.fillStyle = isHead ? "#00e6b3" : "#00d4aa";
        ctx.shadowColor = isHead ? "#00e6b3" : "#00d4aa";
        ctx.shadowBlur = isHead ? 10 : 4;
        ctx.beginPath();
        ctx.roundRect(px, py, sz, sz, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (isHead) {
            ctx.fillStyle = "#0f0f23";
            const eyeSize = 3;
            const cx = seg.x * CELL + CELL / 2;
            const cy = seg.y * CELL + CELL / 2;
            ctx.beginPath();
            ctx.arc(cx - 4, cy - 3, eyeSize, 0, Math.PI * 2);
            ctx.arc(cx + 4, cy - 3, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    if (state.paused) {
        ctx.fillStyle = "rgba(15,15,35,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00d4aa";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("? 暂停", canvas.width / 2, canvas.height / 2);
    }
}

// === Canvas roundRect polyfill ===
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}

// === Input ===

document.addEventListener("keydown", (e) => {
    const key = e.key;

    if (key === " " || key === "Space") {
        e.preventDefault();
        if (!state.started) { restartGame(); return; }
        if (state.gameOver) { restartGame(); return; }
        return;
    }

    if (key === "p" || key === "P") { togglePause(); return; }

    if (!state.running || state.paused) return;

    let newDir;
    switch (key) {
        case "ArrowUp": case "w": case "W": newDir = DIR.UP; break;
        case "ArrowDown": case "s": case "S": newDir = DIR.DOWN; break;
        case "ArrowLeft": case "a": case "A": newDir = DIR.LEFT; break;
        case "ArrowRight": case "d": case "D": newDir = DIR.RIGHT; break;
        default: return;
    }

    e.preventDefault();

    // Prevent 180-degree turn
    if ((state.dir === DIR.UP && newDir === DIR.DOWN) ||
        (state.dir === DIR.DOWN && newDir === DIR.UP) ||
        (state.dir === DIR.LEFT && newDir === DIR.RIGHT) ||
        (state.dir === DIR.RIGHT && newDir === DIR.LEFT)) {
        return;
    }
    state.nextDir = newDir;
});

// === API ===

async function submitScore() {
    const name = playerNameInput.value.trim() || "匿名";
    try {
        const res = await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerName: name, score: state.score, length: state.snake.length }),
        });
        if (res.ok) {
            submitMsg.textContent = "? 分数已提交！";
            submitMsg.classList.remove("hidden");
            submitBtn.disabled = true;
            fetchLeaderboard();
        } else {
            submitMsg.textContent = "? 提交失败";
            submitMsg.classList.remove("hidden");
        }
    } catch {
        submitMsg.textContent = "? 无法连接到服务器";
        submitMsg.classList.remove("hidden");
    }
}

async function fetchLeaderboard() {
    try {
        const res = await fetch("/api/scores");
        const data = await res.json();
        rankBody.innerHTML = data.map((s, i) =>
            `<tr><td>${i + 1}</td><td>${escHtml(s.playerName)}</td><td>${s.score}</td><td>${s.length}</td></tr>`
        ).join("");
    } catch { /* ignore */ }
}

function escHtml(s) { return String(s).replace(/[&<>"]/g, ""); }

function updateScoreDisplay() {
    scoreEl.textContent = state.score;
    highScoreEl.textContent = state.highScore;
}

// === Init ===
initGame();
draw();
highScoreEl.textContent = state.highScore;
fetchLeaderboard();
