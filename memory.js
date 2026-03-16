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


/* ===== PARTICLES ===== */
const c = document.getElementById('particles');
const x = c.getContext('2d');
function r() { c.width = innerWidth; c.height = innerHeight; }
r(); 
addEventListener('resize', r);

let p = [...Array(60)].map(() => ({
    x: Math.random() * c.width,
    y: Math.random() * c.height,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - .5) * .4,
    dy: (Math.random() - .5) * .4
}));

(function a() {
    x.clearRect(0, 0, c.width, c.height);
    p.forEach(o => {
        o.x += o.dx; o.y += o.dy;
        if (o.x < 0 || o.x > c.width) o.dx *= -1;
        if (o.y < 0 || o.y > c.height) o.dy *= -1;
        x.beginPath(); 
        x.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        x.fillStyle = 'rgba(34,197,94,.7)';
        x.fill();
    });
    requestAnimationFrame(a);
})();

/* ===== SCREENS ===== */
const screens = {
    mode: document.getElementById("modeScreen"),
    size: document.getElementById("sizeScreen"),
    name: document.getElementById("nameScreen"),
    difficulty: document.getElementById("difficultyScreen"),
    game: document.getElementById("gameScreen")
};

const board = document.getElementById("board");
const sub = document.querySelector(".sub");
const winnerText = document.getElementById("winnerText");

let currentScreen = "mode";
let mode = null;
let size = 4;
let difficulty = "easy";

let player1 = "Player";
let player2 = "Computer";

let currentPlayer = 1;
let score1 = 0;
let score2 = 0;

let first = null, second = null, lock = false, matches = 0, symbols = [];
let aiMemory = {};

/* ===== HISTORY SYSTEM (NATIVE MOBILE GESTURES) ===== */
window.addEventListener("load", () => {
    history.replaceState({ screen: "mode" }, "", "#mode");
});

window.addEventListener("popstate", (e) => {
    const s = e.state?.screen || "mode";
    show(s, true); 
});

function show(name, skip = false) {
    Object.values(screens).forEach(s => s.classList.remove("active"));
    if (screens[name]) {
        screens[name].classList.add("active");
    }

    const menu = document.getElementById("menuPanel");
    const game = document.getElementById("gameScreen");

    if (name === "game") {
        menu.style.display = "none";
        game.style.display = "flex";
    } else {
        menu.style.display = "flex";
        game.style.display = "none";
    }

    currentScreen = name;

    if (!skip) {
        history.pushState({ screen: name }, "", "#" + name);
    }
}

/* ===== BACK BUTTON ===== */
function goBack() {
    if (currentScreen === "mode") {
        window.location.href = "index.html";
    } else {
        history.back();
    }
}

/* ===== POPUP LOGIC ===== */
function showRules() {
    document.getElementById("rulesPopup").classList.add("show");
}

function hideRules() {
    document.getElementById("rulesPopup").classList.remove("show");
}

function showWinnerPopup(msg) {
    winnerText.textContent = msg;
    document.getElementById("winPopup").classList.add("show");
}

/* ===== MENU BUTTON ===== */
document.querySelectorAll(".modeBtn").forEach(b => {
    b.onclick = () => { mode = b.dataset.mode; show("size"); };
});

document.querySelectorAll(".sizeBtn").forEach(b => {
    b.onclick = () => {
        size = parseInt(b.dataset.size);

        if (mode === "pvp") { show("name"); return; }
        if (mode === "ai") { player1 = "Player"; player2 = "Computer"; show("difficulty"); return; }
    };
});

document.getElementById("startBtn").onclick = () => {
    player1 = document.getElementById("p1").value || "Player 1";
    player2 = document.getElementById("p2").value || "Player 2";
    startGame();
};

document.querySelectorAll(".diffBtn").forEach(b => {
    b.onclick = () => {
        difficulty = b.dataset.diff;
        show("game");
        setTimeout(() => setupGame(size), 50);
    };
});

document.getElementById("restartBtn").onclick = () => setupGame(size);

document.getElementById("playAgain").onclick = () => {
    document.getElementById("winPopup").classList.remove("show");
    setupGame(size);
};

document.getElementById("menuBtn").onclick = () => {
    document.getElementById("winPopup").classList.remove("show");
    show("mode");
};

/* ===== GAME START ===== */
function startGame() {
    show("game");
    setupGame(size);
}

/* ===== SYMBOLS ===== */
function generateSymbols(pairCount) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let arr = [];
    for (let i = 0; i < pairCount; i++) {
        const pair = letters[i];
        arr.push(pair, pair);
    }
    return arr.sort(() => Math.random() - .5);
}

/* ===== GAME SETUP ===== */
function setupGame(n) {
    board.innerHTML = "";
    document.getElementById("winPopup").classList.remove("show"); // Safety hide

    board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${n}, 1fr)`;

    first = second = null;
    lock = false;
    matches = 0;
    currentPlayer = 1;
    score1 = 0;
    score2 = 0;
    aiMemory = {};

    symbols = generateSymbols((n * n) / 2);

    symbols.forEach(sym => {
        const c = document.createElement("div");
        c.className = "card";
        c.dataset.symbol = sym;
        c.onclick = () => flipCard(c, true);
        board.appendChild(c);
    });

    updateInfo();
}

/* ===== AI MEMORY ===== */
function remember(card) {
    if (!aiMemory[card.dataset.symbol]) aiMemory[card.dataset.symbol] = [];
    if (!aiMemory[card.dataset.symbol].includes(card)) {
        aiMemory[card.dataset.symbol].push(card);
    }
}

/* ===== CARD FLIP ===== */
function flipCard(card, isHuman = false) {
    if (lock || card.classList.contains("open") || card.classList.contains("matched")) return;
    if (isHuman && mode === "ai" && currentPlayer === 2) return;

    card.classList.add("open");
    card.textContent = card.dataset.symbol;
    remember(card);

    if (!first) { 
        first = card; 
        return; 
    }

    second = card;
    lock = true; 

    if (first.dataset.symbol === second.dataset.symbol) {
        setTimeout(() => {
            first.classList.add("matched");
            second.classList.add("matched");

            if (currentPlayer === 1) score1++;
            else score2++;

            matches++;
            resetTurn();
            updateInfo();

            if (matches >= symbols.length / 2) {
                setTimeout(showWinner, 350);
                return;
            }

            if (mode === "ai" && currentPlayer === 2) {
                setTimeout(aiMove, 600);
            }

        }, 400);

    } else {
        setTimeout(() => {
            first.classList.remove("open");
            second.classList.remove("open");
            first.textContent = "";
            second.textContent = "";

            currentPlayer = currentPlayer === 1 ? 2 : 1;

            resetTurn();
            updateInfo();

            if (mode === "ai" && currentPlayer === 2) {
                setTimeout(aiMove, 600);
            }

        }, 800);
    }
}

function resetTurn() { 
    first = second = null; 
    lock = false; 
}

function updateInfo() {
    document.getElementById("p1Score").textContent = `${player1}: ${score1}`;
    document.getElementById("p2Score").style.display = "block";
    document.querySelector(".vs").style.display = "block";
    document.getElementById("p2Score").textContent = `${player2}: ${score2}`;

    document.getElementById("p1Score").classList.toggle("active", currentPlayer === 1);
    document.getElementById("p2Score").classList.toggle("active", currentPlayer === 2);

    if (sub) sub.textContent = "";
}

/* ===== AI MOVE ===== */
function aiMove() {
    if (matches >= symbols.length / 2) return;

    if (difficulty === "hard" || (difficulty === "medium" && Math.random() > 0.4)) {
        for (let sym in aiMemory) {
            let knownCards = aiMemory[sym].filter(c => !c.classList.contains("matched"));
            if (knownCards.length === 2) {
                flipCard(knownCards[0], false);
                setTimeout(() => flipCard(knownCards[1], false), 600);
                return;
            }
        }
    }

    let available = [...board.children].filter(c => !c.classList.contains("matched") && !c.classList.contains("open"));
    if (available.length === 0) return;
    
    let c1 = available[Math.floor(Math.random() * available.length)];
    flipCard(c1, false);

    setTimeout(() => {
        let realizedMatch = aiMemory[c1.dataset.symbol]?.find(c => c !== c1 && !c.classList.contains("matched"));
        
        if (realizedMatch && (difficulty === "hard" || (difficulty === "medium" && Math.random() > 0.3))) {
            flipCard(realizedMatch, false);
        } else {
            available = [...board.children].filter(c => !c.classList.contains("matched") && !c.classList.contains("open") && c !== c1);
            if (available.length > 0) {
                let c2 = available[Math.floor(Math.random() * available.length)];
                flipCard(c2, false);
            }
        }
    }, 600);
}

/* ===== WIN ===== */
function showWinner() {
    let msg = score1 > score2 ? `${player1} Wins!` : score2 > score1 ? `${player2} Wins!` : "Draw!";
    showWinnerPopup(msg);
}