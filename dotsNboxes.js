// Force safe return if browser tries to restore cached blank page
window.addEventListener("pageshow", e => {
    if (e.persisted) {
        window.location.href = "index.html";
    }
});

/* ===== BACKGROUND MUSIC AUTOPLAY FIX ===== */
document.body.addEventListener("click", () => {
    const bgMusic = document.getElementById("bgMusic");
    if (bgMusic && bgMusic.paused) {
        bgMusic.volume = 0.4; 
        bgMusic.play().catch(e => console.log("Audio play prevented:", e));
    }
}, { once: true }); 

/* ===== MUSIC TOGGLE (SVG Update) ===== */
function toggleMusic() {
    const bgMusic = document.getElementById("bgMusic");
    const audioIcon = document.getElementById("audioIcon");
    
    // High fidelity SVG swapping logic
    const volumeOnPath = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    const volumeOffPath = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';

    if (bgMusic.paused) {
        bgMusic.play();
        audioIcon.innerHTML = volumeOnPath;
    } else {
        bgMusic.pause();
        audioIcon.innerHTML = volumeOffPath;
    }
}

/* ========= ELEMENTS ========= */
const modeScreen = document.getElementById("modeScreen");
const aiMenu = document.getElementById("aiMenu");
const gridMenu = document.getElementById("gridMenu");
const nameMenu = document.getElementById("nameMenu");
const gameScreen = document.getElementById("gameScreen");
const board = document.getElementById("gameBoard");
const popupText = document.getElementById("winText");
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

const turnText = document.getElementById("turn");
const p1Text = document.getElementById("p1");
const p2Text = document.getElementById("p2");

const name1Input = document.getElementById("name1");
const name2Input = document.getElementById("name2");

let p1Name = "Player 1";
let p2Name = "Player 2";

let mode = "pvp";
let difficulty = "easy";
let gameOver = false;
let currentScreen = "mode";

/* ========= HISTORY NAVIGATION ========= */
window.addEventListener("load", () => {
    history.replaceState({ screen: "mode" }, "", "#mode");
});

window.addEventListener("popstate", (e) => {
    const s = e.state?.screen || "mode";
    showScreen(s, true); 
});

function showScreen(screen, skip = false) {
    modeScreen.classList.add("hidden");
    aiMenu.classList.add("hidden");
    gridMenu.classList.add("hidden");
    nameMenu.classList.add("hidden");
    gameScreen.classList.add("hidden");

    if (screen === "mode") modeScreen.classList.remove("hidden");
    if (screen === "ai") aiMenu.classList.remove("hidden");
    if (screen === "grid") gridMenu.classList.remove("hidden");
    if (screen === "names") nameMenu.classList.remove("hidden");
    if (screen === "game") gameScreen.classList.remove("hidden");

    currentScreen = screen;

    if (!skip) {
        history.pushState({ screen: screen }, "", "#" + screen);
    }
}

/* ========= POPUP LOGIC ========= */
function showRules() {
    document.getElementById("rulesPopup").classList.add("show");
}

function hideRules() {
    document.getElementById("rulesPopup").classList.remove("show");
}

/* ========= BACK BUTTON ========= */
function handleBack() {
    if (currentScreen === "mode") {
        window.location.href = "index.html";
    } else {
        history.back();
    }
}

/* ========= NAVIGATION ========= */
function openAiMenu() {
    mode = "ai";
    showScreen("ai");
}

function chooseGrid(selected) {
    if (selected === "easy" || selected === "medium" || selected === "hard") {
        mode = "ai";
        difficulty = selected;
    } else {
        mode = "pvp";
    }
    showScreen("grid");
}

function startSizedGame(s) {
    size = s;
    grid = size * 2 + 1;

    if (mode === "ai") {
        name2Input.value = "AI";
        name2Input.disabled = true;
    } else {
        name2Input.disabled = false;
        name2Input.value = "";
    }

    showScreen("names");
}

function startGameWithNames() {
    p1Name = name1Input.value.trim() || "Player 1";
    p2Name = name2Input.value.trim() || (mode === "ai" ? "AI" : "Player 2");

    document.querySelector("#p1Card .playerName").innerHTML = `${p1Name} <span style="color:#d8b4fe;">@</span>`;
    document.querySelector("#p2Card .playerName").innerHTML = `${p2Name} <span style="color:#fff;">#</span>`;

    showScreen("game");
    buildBoard();
}

/* ========= PARTICLES ========= */
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const particles = [];
for (let i = 0; i < 120; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2 + 1,
        dx: (Math.random() - .5) * .25,
        dy: (Math.random() - .5) * .25
    });
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,120,255,.65)";
        ctx.shadowColor = "rgba(168,85,247,.9)";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();

/* ========= GAME ========= */
let size = 4;
let grid = size * 2 + 1;
let current = 1, score1 = 0, score2 = 0;
const cells = [];
const sym1Val = "@";
const sym2Val = "#";

function buildBoard() {
    board.innerHTML = "";
    cells.length = 0;
    current = 1; 
    score1 = 0; 
    score2 = 0;
    gameOver = false;
    document.getElementById("winPopup").classList.remove("show"); // Ensure popup is hidden

    let gridLayout = [];
    for (let i = 0; i < grid; i++) {
        gridLayout.push(i % 2 === 0 ? "clamp(8px, 2vmin, 12px)" : "1fr");
    }
    board.style.gridTemplateColumns = gridLayout.join(" ");
    board.style.gridTemplateRows = gridLayout.join(" ");

    for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
            const cell = document.createElement("div");
            cell.dataset.r = r;
            cell.dataset.c = c;

            if (r % 2 === 0 && c % 2 === 0) {
                cell.className = "dot";
            } else if (r % 2 === 0 && c % 2 === 1) {
                cell.className = "hLine";
                cell.onclick = () => activate(cell);
            } else if (r % 2 === 1 && c % 2 === 0) {
                cell.className = "vLine";
                cell.onclick = () => activate(cell);
            } else {
                cell.className = "boxSpace";
            }

            board.appendChild(cell);
            cells.push(cell);
        }
    }
    updateUI();
}

function activate(el) {
    if (gameOver) return;
    if (mode === "ai" && current === 2) return; 
    if (el.classList.contains("p1") || el.classList.contains("p2")) return;

    el.classList.add(current === 1 ? "p1" : "p2");

    const gained = checkBoxes();
    if (!gained) current = current === 1 ? 2 : 1;

    updateUI();
    checkGameEnd();

    if (mode === "ai" && current === 2 && !gameOver) {
        setTimeout(aiMove, 450);
    }
}

/* ========= AI ========= */
function aiMove() {
    const free = cells.filter(c =>
        (c.classList.contains("hLine") || c.classList.contains("vLine")) &&
        !c.classList.contains("p1") && !c.classList.contains("p2")
    );

    if (!free.length) return;

    if (difficulty === "easy") {
        play(random(free));
        return;
    }

    let boxMoves = free.filter(m => wouldComplete(m));
    if (boxMoves.length) {
        play(random(boxMoves));
        return;
    }

    if (difficulty === "hard") {
        let safe = free.filter(m => !createsThirdSide(m));
        if (safe.length) {
            play(random(safe));
            return;
        }
    }

    play(random(free));
}

function random(a) { 
    return a[Math.floor(Math.random() * a.length)]; 
}

function play(cell) {
    cell.classList.add("p2");

    const gained = checkBoxes();
    if (!gained) current = 1;

    updateUI();
    checkGameEnd();

    if (mode === "ai" && gained && !gameOver) {
        setTimeout(aiMove, 350);
    }
}

/* ========= BOX LOGIC ========= */
function getCell(r, c) {
    return cells.find(x => x.dataset.r == r && x.dataset.c == c);
}

function isDrawn(c) {
    return c && (c.classList.contains("p1") || c.classList.contains("p2"));
}

function wouldComplete(line) {
    return adjBoxes(line).some(b => countSides(b) === 3);
}

function createsThirdSide(line) {
    return adjBoxes(line).some(b => countSides(b) === 2);
}

function adjBoxes(line) {
    const r = +line.dataset.r, c = +line.dataset.c;
    let list = [];
    if (line.classList.contains("hLine")) {
        list.push(getCell(r - 1, c), getCell(r + 1, c));
    } else {
        list.push(getCell(r, c - 1), getCell(r, c + 1));
    }
    return list.filter(Boolean);
}

function countSides(box) {
    const r = +box.dataset.r, c = +box.dataset.c;
    let n = 0;
    if (isDrawn(getCell(r - 1, c))) n++;
    if (isDrawn(getCell(r + 1, c))) n++;
    if (isDrawn(getCell(r, c - 1))) n++;
    if (isDrawn(getCell(r, c + 1))) n++;
    return n;
}

function checkBoxes() {
    let gained = false;

    for (let r = 1; r < grid; r += 2) {
        for (let c = 1; c < grid; c += 2) {
            const box = getCell(r, c);
            if (box.dataset.filled) continue;

            const top = getCell(r - 1, c);
            const bottom = getCell(r + 1, c);
            const left = getCell(r, c - 1);
            const right = getCell(r, c + 1);

            if (isDrawn(top) && isDrawn(bottom) && isDrawn(left) && isDrawn(right)) {
                gained = true;
                box.dataset.filled = true;

                if (current === 1) {
                    box.innerHTML = `<span style="color:#d8b4fe;">${sym1Val}</span>`;
                    score1++;
                } else {
                    box.innerHTML = `<span style="color:#fff;">${sym2Val}</span>`;
                    score2++;
                }
            }
        }
    }

    return gained;
}

/* ========= WIN ========= */
function showWinner() {
    gameOver = true;

    let text = "Draw!";
    if (score1 > score2) text = `🏆 ${p1Name} Wins!`;
    else if (score2 > score1) text = `🏆 ${p2Name} Wins!`;

    popupText.textContent = text;
    document.getElementById("winPopup").classList.add("show");
}

function restartGame() {
    document.getElementById("winPopup").classList.remove("show");
    buildBoard();
}

function backToMenu() {
    document.getElementById("winPopup").classList.remove("show");
    showScreen("mode");
}

function checkGameEnd() {
    const total = size * size;
    const filled = cells.filter(c => c.classList.contains("boxSpace") && c.dataset.filled).length;
    if (filled === total) showWinner();
}

/* ========= UI ========= */
function animateScore(el, val) {
    let cur = parseInt(el.textContent) || 0;
    if (cur === val) return;
    
    if (el.animationFrame) cancelAnimationFrame(el.animationFrame);
    
    const step = () => {
        cur += cur < val ? 1 : -1;
        el.textContent = cur;
        if (cur !== val) {
            el.animationFrame = requestAnimationFrame(step);
        }
    };
    step();
}

function updateUI() {
    animateScore(p1Text, score1);
    animateScore(p2Text, score2);

    const p1Card = document.getElementById("p1Card");
    const p2Card = document.getElementById("p2Card");

    p1Card.classList.toggle("active", current === 1);
    p2Card.classList.toggle("active", current === 2);

    turnText.textContent = (current === 1 ? p1Name : p2Name) + "'s Turn";
}