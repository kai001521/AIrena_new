/* --- BACKGROUND MUSIC AUTOPLAY & CONTROLS --- */
window.addEventListener("pageshow", e => { if(e.persisted) window.location.href = "index.html"; });

document.body.addEventListener("click", () => {
    const bgMusic = document.getElementById("bgMusic");
    if (bgMusic && bgMusic.paused) {
        bgMusic.volume = 0.4;
        bgMusic.play().catch(e => console.log("Audio play prevented by browser:", e));
    }
}, { once: true }); 

function toggleMusic() {
    const bgMusic = document.getElementById("bgMusic");
    const audioIcon = document.getElementById("audioIcon");
    const volumeOnPath = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    const volumeOffPath = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
    if (bgMusic.paused) { bgMusic.play(); audioIcon.innerHTML = volumeOnPath; } 
    else { bgMusic.pause(); audioIcon.innerHTML = volumeOffPath; }
}

/* --- PARTICLES BACKGROUND --- */
const bgCanvas = document.getElementById("particles");
const bgCtx = bgCanvas.getContext("2d");
let particlesArray = [];

function resizeBg() { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; }
resizeBg();

const pColors = ["rgba(255, 204, 0, 0.6)", "rgba(212, 175, 55, 0.6)", "rgba(255, 255, 255, 0.2)"];
for (let i = 0; i < (window.innerWidth < 600 ? 40 : 70); i++) {
    particlesArray.push({
        x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height,
        size: Math.random() * 2 + 1, dx: (Math.random() - 0.5) * 0.5, dy: (Math.random() - 0.5) * 0.5,
        color: pColors[Math.floor(Math.random() * pColors.length)]
    });
}

function animateParticles() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    particlesArray.forEach(p => {
        if (p.x > bgCanvas.width || p.x < 0) p.dx *= -1;
        if (p.y > bgCanvas.height || p.y < 0) p.dy *= -1;
        p.x += p.dx; p.y += p.dy;
        bgCtx.beginPath(); bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2); bgCtx.fillStyle = p.color; bgCtx.fill();
    });
    requestAnimationFrame(animateParticles);
}
animateParticles();
window.addEventListener("resize", resizeBg);

/* --- UI NAVIGATION --- */
function goBack() { window.location.href = "index.html"; }

document.getElementById("rulesBtn").onclick = () => document.getElementById("rulesPopup").classList.remove("hidden");
document.getElementById("rulesOkBtn").onclick = () => document.getElementById("rulesPopup").classList.add("hidden");
document.getElementById("menuReturnBtn").onclick = () => { 
    document.getElementById("gameOverPopup").classList.add("hidden"); 
    document.getElementById("gameScreen").classList.remove("active");
    document.getElementById("menuPanel").style.display = "flex";
};
document.getElementById("startBtn").onclick = () => { 
    document.getElementById("menuPanel").style.display = "none";
    document.getElementById("gameScreen").classList.add("active");
    initGame(); 
};
document.getElementById("playAgainBtn").onclick = () => { 
    document.getElementById("gameOverPopup").classList.add("hidden"); 
    initGame(); 
};

/* --- PAC-MAN ENGINE --- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('scoreVal');
const livesEl = document.getElementById('livesVal');

const TILE = 40; const ROWS = 15; const COLS = 15;

// 1 = Wall, 0 = Dot, 2 = Empty, 3 = Power Pellet
const initialMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,1,0,0,0,0,0,3,1],
    [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,2,2,2,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,1,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,2,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,0,1,1,1,1,0,1],
    [1,3,0,0,0,0,0,1,0,0,0,0,0,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const DIRS = { UP: {x: 0, y: -1, angle: -Math.PI/2}, DOWN: {x: 0, y: 1, angle: Math.PI/2}, LEFT: {x: -1, y: 0, angle: Math.PI}, RIGHT: {x: 1, y: 0, angle: 0}, NONE: {x: 0, y: 0, angle: 0} };

let map = [], score = 0, lives = 3, isPlaying = false, totalDots = 0;
let frightenedTimer = 0;

class Entity {
    constructor(c, r, color, isPlayer = false) {
        this.startC = c; this.startR = r;
        this.color = color; this.isPlayer = isPlayer;
        this.respawnTimer = 0; // The 3 second timer
        this.resetPos();
    }
    resetPos() {
        this.c = this.startC; this.r = this.startR;
        this.x = this.c * TILE; this.y = this.r * TILE;
        this.dir = DIRS.NONE; this.nextDir = DIRS.NONE;
        this.speed = 2;
    }
    update() {
        if (this.respawnTimer > 0) {
            this.respawnTimer--; 
            return; // Don't move while dead
        }

        if (this.x % TILE === 0 && this.y % TILE === 0) {
            this.c = this.x / TILE; this.r = this.y / TILE;
            if (this.isPlayer) {
                if (map[this.r][this.c] === 0 || map[this.r][this.c] === 3) {
                    if(map[this.r][this.c] === 3) frightenedTimer = 500; 
                    map[this.r][this.c] = 2;
                    score += 10; scoreEl.innerText = score;
                    totalDots--;
                    if (totalDots === 0) return endGame("YOU WIN!", "#ffcc00"); 
                }
                if (this.canMove(this.nextDir)) this.dir = this.nextDir;
                else if (!this.canMove(this.dir)) this.dir = DIRS.NONE;
            } else {
                this.botAI();
            }
        }
        this.x += this.dir.x * this.speed; this.y += this.dir.y * this.speed;
        if (this.x < 0) this.x = canvas.width - TILE;
        if (this.x >= canvas.width) this.x = 0;
    }
    canMove(d) {
        if (d === DIRS.NONE) return false;
        let nc = this.c + d.x, nr = this.r + d.y;
        if (nc < 0 || nc >= COLS) return true; 
        return map[nr][nc] !== 1;
    }
    botAI() {
        let moves = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT].filter(d => 
            this.canMove(d) && (d.x !== -this.dir.x || d.y !== -this.dir.y));
        if (!moves.length) moves = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT].filter(d => this.canMove(d));
        
        if(frightenedTimer > 0) {
            this.dir = moves[Math.floor(Math.random() * moves.length)]; 
        } else if (this.color === '#ff3a3a' && moves.length > 0) { // Red Ghost logic
            let best = moves[0], minDist = Infinity;
            moves.forEach(m => {
                let d = Math.hypot((this.c + m.x) - player.c, (this.r + m.y) - player.r);
                if (d < minDist) { minDist = d; best = m; }
            });
            this.dir = best;
        } else if (moves.length > 0) {
            this.dir = moves[Math.floor(Math.random() * moves.length)];
        }
    }
    draw() {
        if (this.respawnTimer > 0) return; // Invisible while dead

        ctx.save();
        let t = Date.now();
        if (this.isPlayer) {
            let mouth = this.dir === DIRS.NONE ? 0 : (Math.sin(t/100)+1)*0.2;
            ctx.translate(this.x + TILE/2, this.y + TILE/2);
            ctx.rotate(this.dir.angle);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 15; ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, TILE/2 - 4, mouth * Math.PI, (2 - mouth) * Math.PI);
            ctx.lineTo(0, 0); ctx.fill();
        } else {
            let bob = Math.sin(t / 150 + this.startC) * 3;
            ctx.translate(this.x, this.y + bob);
            let cx = TILE/2, cy = TILE/2, r = TILE/2 - 4;
            
            ctx.fillStyle = frightenedTimer > 0 ? '#1a1500' : this.color;
            ctx.strokeStyle = frightenedTimer > 0 ? '#ffcc00' : 'transparent';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(cx, cy - 2, r, Math.PI, 0);
            ctx.lineTo(cx + r, TILE - 4);
            
            let wave = (Math.sin(t / 100) + 1) * 2;
            ctx.lineTo(cx + r - r/2, TILE - 4 - wave);
            ctx.lineTo(cx, TILE - 4 + wave);
            ctx.lineTo(cx - r + r/2, TILE - 4 - wave);
            ctx.lineTo(cx - r, TILE - 4);
            ctx.fill(); if(frightenedTimer > 0) ctx.stroke();

            if (frightenedTimer === 0) {
                ctx.fillStyle = 'white';
                ctx.beginPath(); ctx.arc(cx-5, cy-4, 4, 0, Math.PI*2); ctx.arc(cx+5, cy-4, 4, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#1a1500';
                ctx.beginPath(); ctx.arc(cx-5+this.dir.x*2, cy-4+this.dir.y*2, 2, 0, Math.PI*2); ctx.arc(cx+5+this.dir.x*2, cy-4+this.dir.y*2, 2, 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.restore();
    }
}

let player; let bots = [];

function initGame() {
    map = initialMap.map(row => [...row]);
    totalDots = 0; map.forEach(r => r.forEach(t => { if(t===0 || t===3) totalDots++; }));
    score = 0; lives = 3; scoreEl.innerText = score; livesEl.innerText = lives;
    frightenedTimer = 0;
    
    player = new Entity(7, 11, '#ffcc00', true);
    bots = [
        new Entity(7, 6, '#ff3a3a'), // Red
        new Entity(6, 7, '#00e5ff'), // Cyan
        new Entity(8, 7, '#ff8cf9')  // Pink
    ];
    isPlaying = true;
    requestAnimationFrame(gameLoop);
}

function checkCollisions() {
    bots.forEach(bot => {
        if (bot.respawnTimer > 0) return; // Can't touch a dead ghost
        if (Math.abs(player.x - bot.x) < TILE - 10 && Math.abs(player.y - bot.y) < TILE - 10) {
            if (frightenedTimer > 0) {
                score += 50; scoreEl.innerText = score;
                bot.resetPos(); 
                bot.respawnTimer = 180; // 3 SECONDS RESPAWN DELAY (60fps * 3)
            } else {
                lives--; livesEl.innerText = lives;
                if (lives <= 0) endGame("GAME OVER", "#ff3a3a");
                else { player.resetPos(); bots.forEach(b => { b.resetPos(); b.respawnTimer = 0; }); }
            }
        }
    });
}

function endGame(msg, color) {
    isPlaying = false;
    document.getElementById("endMessage").innerText = msg;
    document.getElementById("endMessage").style.color = color;
    document.getElementById("endMessage").style.textShadow = `0 0 10px ${color}`;
    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOverPopup").classList.remove("hidden");
}

function gameLoop() {
    if (!isPlaying) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (frightenedTimer > 0) frightenedTimer--;

    for (let r=0; r<ROWS; r++) {
        for (let c=0; c<COLS; c++) {
            if (map[r][c] === 1) {
                ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2; // Deep Gold Walls
                ctx.strokeRect(c*TILE + 2, r*TILE + 2, TILE - 4, TILE - 4);
            } else if (map[r][c] === 0) {
                ctx.fillStyle = '#ffcc00'; ctx.fillRect(c*TILE + TILE/2 - 3, r*TILE + TILE/2 - 3, 6, 6);
            } else if (map[r][c] === 3) {
                ctx.fillStyle = '#ffffff'; 
                ctx.beginPath(); ctx.arc(c*TILE + TILE/2, r*TILE + TILE/2, 8 + Math.sin(Date.now()/150)*2, 0, Math.PI*2); ctx.fill();
            }
        }
    }
    
    player.update(); player.draw();
    bots.forEach(b => { b.update(); b.draw(); });
    checkCollisions();
    
    requestAnimationFrame(gameLoop);
}

/* --- BULLETPROOF MOBILE CONTROLS (From Tetris) --- */
function setDir(d) { if(player && isPlaying) player.nextDir = DIRS[d]; }

const setupSingleTap = (btnId, action) => {
    const btn = document.getElementById(btnId);
    btn.addEventListener("touchstart", e => { e.preventDefault(); action(); }, {passive: false});
    btn.addEventListener("mousedown", e => { e.preventDefault(); action(); });
};

setupSingleTap("btnUp", () => setDir('UP'));
setupSingleTap("btnDown", () => setDir('DOWN'));
setupSingleTap("btnLeft", () => setDir('LEFT'));
setupSingleTap("btnRight", () => setDir('RIGHT'));

window.addEventListener('keydown', e => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(e.key)) {
        e.preventDefault();
        if(e.key==='ArrowUp'||e.key==='w') setDir('UP');
        if(e.key==='ArrowDown'||e.key==='s') setDir('DOWN');
        if(e.key==='ArrowLeft'||e.key==='a') setDir('LEFT');
        if(e.key==='ArrowRight'||e.key==='d') setDir('RIGHT');
    }
});