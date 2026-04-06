// Force safe return if browser restores cached blank page
window.addEventListener("pageshow", e => {
    if (e.persisted) window.location.href = "index.html";
});

/* ---------- PARTICLES (Green Theme) ---------- */
const canvas = document.getElementById("bgParticles");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
resizeCanvas();
addEventListener("resize", resizeCanvas);
addEventListener("orientationchange", resizeCanvas);

let particles = [];
for (let i = 0; i < 40; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1,
        dx: (Math.random() - .5) * 0.3,
        dy: (Math.random() - .5) * 0.3
    });
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(76, 175, 80, 0.3)";
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();

/* ---------- SCREENS NAVIGATION ---------- */
const screens = ["screenStart", "screenGame"];
let currentScreen = "screenStart";

window.addEventListener("load", () => {
    history.replaceState({ screen: "screenStart" }, "", "#screenStart");
});

window.addEventListener("popstate", (e) => {
    const s = e.state?.screen || "screenStart";
    show(s, true);
});

function show(id, skip = false) {
    screens.forEach(s => document.getElementById(s).classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    currentScreen = id;
    if (!skip) history.pushState({ screen: id }, "", "#" + id);
}

function goBack() {
    if (currentScreen === "screenStart") window.location.href = "index.html";
    else history.back();
}

/* ---------- POPUPS ---------- */
function showRules() { document.getElementById("rulesPopup").classList.add("show"); }
function hideRules() { document.getElementById("rulesPopup").classList.remove("show"); }
function showGameOver() { document.getElementById("gameOverPopup").classList.add("show"); }
function hideGameOver() { document.getElementById("gameOverPopup").classList.remove("show"); }

/* ---------- 2048 GAME STATE ---------- */
let board = [];
let score = 0;
let best = localStorage.getItem("best2048") || 0;
const size = 4;
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

bestEl.textContent = best;

/* ---------- INIT & DRAW ---------- */
function startGame() {
    board = Array(size).fill().map(() => Array(size).fill(0));
    score = 0;
    hideGameOver();
    addTile();
    addTile();
    draw();
}

function draw() {
    boardEl.innerHTML = "";
    board.forEach(row => {
        row.forEach(cell => {
            const div = document.createElement("div");
            div.className = "tile tile-" + cell;
            if (cell !== 0) div.classList.add("pop");
            div.textContent = cell || "";
            boardEl.appendChild(div);
        });
    });

    scoreEl.textContent = score;
    if (score > best) {
        best = score;
        localStorage.setItem("best2048", best);
        bestEl.textContent = best;
    }
}

/* ---------- RANDOM TILE ---------- */
function addTile() {
    let empty = [];
    board.forEach((r, i) => {
        r.forEach((c, j) => {
            if (c === 0) empty.push({ i, j });
        });
    });
    if (empty.length === 0) return;
    let { i, j } = empty[Math.floor(Math.random() * empty.length)];
    board[i][j] = Math.random() > 0.9 ? 4 : 2;
}

/* ---------- MOVE LOGIC ---------- */
function slide(row) {
    row = row.filter(v => v);
    for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
            row[i] *= 2;
            score += row[i];
            row[i + 1] = 0;
        }
    }
    row = row.filter(v => v);
    while (row.length < size) row.push(0);
    return row;
}

function rotate() {
    let newBoard = Array(size).fill().map(() => Array(size).fill(0));
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            newBoard[i][j] = board[j][i];
        }
    }
    board = newBoard;
}

/* ---------- MOVEMENT EXECUTION ---------- */
function handleMove(callback) {
    if (currentScreen !== "screenGame") return;
    let old = JSON.stringify(board);
    callback();
    if (JSON.stringify(board) !== old) {
        addTile();
        draw();
        checkGameOver();
    }
}

function moveLeft() { handleMove(() => { board = board.map(row => slide(row)); }); }
function moveRight() { handleMove(() => { board = board.map(r => r.reverse()); board = board.map(row => slide(row)); board = board.map(r => r.reverse()); }); }
function moveUp() { handleMove(() => { rotate(); board = board.map(row => slide(row)); rotate(); }); }
function moveDown() { handleMove(() => { rotate(); board = board.map(r => r.reverse()); board = board.map(row => slide(row)); board = board.map(r => r.reverse()); rotate(); }); }

/* ---------- GAME OVER CHECK ---------- */
function checkGameOver() {
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (board[i][j] === 0) return;
            if (i < size - 1 && board[i][j] === board[i + 1][j]) return;
            if (j < size - 1 && board[i][j] === board[i][j + 1]) return;
        }
    }
    setTimeout(() => showGameOver(), 500);
}

/* ---------- INPUT LOGIC ---------- */
document.addEventListener("keydown", e => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "ArrowLeft") moveLeft();
        if (e.key === "ArrowRight") moveRight();
        if (e.key === "ArrowUp") moveUp();
        if (e.key === "ArrowDown") moveDown();
    }
});

/* ---------- MOBILE SWIPE FIX ---------- */
let startX, startY;
const boardWrap = document.getElementById("boardWrap");

boardWrap.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}, { passive: false });

// Prevents the entire screen from scrolling when attempting to swipe on the board
boardWrap.addEventListener("touchmove", e => {
    e.preventDefault();
}, { passive: false });

boardWrap.addEventListener("touchend", e => {
    if (!startX || !startY) return;
    let dx = e.changedTouches[0].clientX - startX;
    let dy = e.changedTouches[0].clientY - startY;

    // Must swipe a minimum distance to count
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
            dx > 0 ? moveRight() : moveLeft();
        } else {
            dy > 0 ? moveDown() : moveUp();
        }
    }
    startX = null;
    startY = null;
});

// Initial Setup
draw();

/* ---------- MUSIC AUTOPLAY & TOGGLE ---------- */
window.addEventListener("DOMContentLoaded", () => {
    const bgMusic = document.getElementById("bgMusic");
    const muteBtn = document.getElementById("muteBtn");
    if (!bgMusic) return;

    bgMusic.volume = 0.4; // Set volume to 40%

    // Attempt to autoplay
    const playPromise = bgMusic.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Autoplay succeeded (user navigated from the Hub)
            if (muteBtn) muteBtn.classList.remove("muted");
        }).catch(error => {
            // Autoplay blocked by browser (user refreshed the page directly)
            console.log("Autoplay blocked. Waiting for first interaction...");
            if (muteBtn) muteBtn.classList.add("muted"); // Visually show it's muted

            const startMusic = () => {
                if (bgMusic.paused) {
                    bgMusic.play().catch(e => console.log("Audio play prevented:", e));
                    if (muteBtn) muteBtn.classList.remove("muted");
                }
                document.removeEventListener("click", startMusic);
                document.removeEventListener("touchstart", startMusic);
            };

            // Wait for any screen tap to force audio to start
            document.addEventListener("click", startMusic);
            document.addEventListener("touchstart", startMusic);
        });
    }
});

function toggleMusic() {
    const bgMusic = document.getElementById("bgMusic");
    const muteBtn = document.getElementById("muteBtn");

    if (bgMusic.paused) {
        bgMusic.play();
        muteBtn.classList.remove("muted");
    } else {
        bgMusic.pause();
        muteBtn.classList.add("muted");
    }
}