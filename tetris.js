/* --- BACKGROUND MUSIC AUTOPLAY & CONTROLS --- */
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
const screens = { mode: document.getElementById("modeScreen"), game: document.getElementById("gameScreen") };
let stack = ["mode"];

function show(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
  document.getElementById("menuPanel").style.display = name === "game" ? "none" : "flex";
  document.getElementById("gameScreen").style.display = name === "game" ? "flex" : "none";
  if (stack[stack.length - 1] !== name) stack.push(name);
}

window.goBack = function() {
  if (stack.length <= 1 || stack[stack.length - 1] === "mode") { window.location.href = "index.html"; return; }
  stack.pop(); show(stack[stack.length - 1]);
  pauseGame();
};

document.getElementById("rulesBtn").onclick = () => document.getElementById("rulesPopup").classList.remove("hidden");
document.getElementById("rulesOkBtn").onclick = () => document.getElementById("rulesPopup").classList.add("hidden");
document.getElementById("menuReturnBtn").onclick = () => { document.getElementById("gameOverPopup").classList.add("hidden"); stack = ["mode"]; show("mode"); };
document.getElementById("startBtn").onclick = () => { show("game"); initGame(); };
document.getElementById("playAgainBtn").onclick = () => { document.getElementById("gameOverPopup").classList.add("hidden"); initGame(); };

/* --- TETRIS ENGINE --- */
const canvas = document.getElementById("tetrisBoard");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");

// Scaled up for higher resolution (450/15 = 30)
ctx.scale(30, 30);
nextCtx.scale(30, 30);

const colors = [ null, '#f55e5ec8', '#59d887ba', '#6ba3fdc2', '#e58a4ac0', '#fbd153e1', '#5de5fdc0', '#b369f9b1' ];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) { matrix.push(new Array(w).fill(0)); }
  return matrix;
}

function createPiece(type) {
  if (type === 'T') { return [ [0, 0, 0], [7, 7, 7], [0, 7, 0] ]; } 
  else if (type === 'O') { return [ [5, 5], [5, 5] ]; } 
  else if (type === 'L') { return [ [0, 4, 0], [0, 4, 0], [0, 4, 4] ]; } 
  else if (type === 'J') { return [ [0, 3, 0], [0, 3, 0], [3, 3, 0] ]; } 
  else if (type === 'I') { return [ [0, 6, 0, 0], [0, 6, 0, 0], [0, 6, 0, 0], [0, 6, 0, 0] ]; } 
  else if (type === 'S') { return [ [0, 2, 2], [2, 2, 0], [0, 0, 0] ]; } 
  else if (type === 'Z') { return [ [1, 1, 0], [0, 1, 1], [0, 0, 0] ]; }
}

let arena = createMatrix(15, 25);
let player = { pos: {x: 0, y: 0}, matrix: null, score: 0, level: 1, lines: 0 };
let nextPiece = null;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameActive = false;
let animationId = null;

// Animation Variables
let animatingRows = [];
let animationProgress = 0;

function drawMatrix(matrix, offset, context, isGhost = false) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        if(isGhost) {
            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.fillRect(x + offset.x, y + offset.y, 1, 1);
            context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            context.lineWidth = 0.05;
            context.strokeRect(x + offset.x, y + offset.y, 1, 1);
        } else {
            context.fillStyle = colors[value];
            context.fillRect(x + offset.x, y + offset.y, 1, 1);
            
            context.fillStyle = "rgba(255,255,255,0.3)";
            context.fillRect(x + offset.x, y + offset.y, 1, 0.1);
            context.fillRect(x + offset.x, y + offset.y, 0.1, 1);
            context.fillStyle = "rgba(0,0,0,0.3)";
            context.fillRect(x + offset.x, y + offset.y + 0.9, 1, 0.1);
            context.fillRect(x + offset.x + 0.9, y + offset.y, 0.1, 1);
        }
      }
    });
  });
}

function draw() {
  ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Subtle Background Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 0.05;
  for(let i=0; i<=15; i++) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 25); ctx.stroke(); }
  for(let i=0; i<=25; i++) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(15, i); ctx.stroke(); }

  drawMatrix(arena, {x: 0, y: 0}, ctx);

  // Hide piece while animating row clears
  if(player.matrix && gameActive && animationProgress === 0) {
    const ghost = { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y } };
    while (!collide(arena, ghost)) { ghost.pos.y++; }
    ghost.pos.y--;
    drawMatrix(ghost.matrix, ghost.pos, ctx, true);

    drawMatrix(player.matrix, player.pos, ctx);
  }

  // Draw smooth shrinking clear animation
  if (animationProgress > 0) {
    animatingRows.forEach(item => {
      item.row.forEach((value, x) => {
        if (value !== 0) {
          const scale = animationProgress; // Shrinks 1 to 0
          const offset = (1 - scale) / 2; // Keeps block centered while shrinking
          
          ctx.globalAlpha = animationProgress;
          
          // Draw bright core
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; 
          ctx.fillRect(x + offset, item.y + offset, scale, scale);
          
          // Outer Gold Glow
          ctx.fillStyle = `rgba(255, 204, 0, ${animationProgress})`;
          ctx.fillRect(x + offset - 0.1, item.y + offset - 0.1, scale + 0.2, scale + 0.2);
          
          ctx.globalAlpha = 1.0;
        }
      });
    });
  }
}

function drawNext() {
  nextCtx.fillStyle = '#000000'; nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if(nextPiece) {
    let offset = { x: 2 - nextPiece[0].length / 2, y: 2 - nextPiece.length / 2 };
    drawMatrix(nextPiece, offset, nextCtx);
  }
}

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) { arena[y + player.pos.y][x + player.pos.x] = value; }
    });
  });
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) { [ matrix[x][y], matrix[y][x] ] = [ matrix[y][x], matrix[x][y] ]; }
  }
  if (dir > 0) { matrix.forEach(row => row.reverse()); } else { matrix.reverse(); }
}

function playerRotate(dir) {
  const pos = player.pos.x; let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset; offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) { rotate(player.matrix, -dir); player.pos.x = pos; return; }
  }
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) { player.pos.x -= dir; }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--; merge(arena, player);
    if(!arenaSweep()) { playerReset(); } 
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(arena, player)) { player.pos.y++; }
  player.pos.y--; merge(arena, player);
  if(!arenaSweep()) { playerReset(); }
  dropCounter = 0;
}

function playerReset() {
  const pieces = 'ILJOTSZ';
  if(!nextPiece) nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.matrix = nextPiece;
  nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
  drawNext();
  player.pos.y = 0; player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  if (collide(arena, player)) {
    gameActive = false; document.getElementById("finalScore").innerText = player.score;
    document.getElementById("gameOverPopup").classList.remove("hidden");
  }
}

function arenaSweep() {
  let rowsToClear = [];
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) { continue outer; }
    }
    rowsToClear.push(y);
  }
  
  if (rowsToClear.length > 0) {
    // Save state for smooth animation
    animatingRows = rowsToClear.map(y => ({ y: y, row: [...arena[y]] }));
    rowsToClear.forEach(y => arena[y].fill(0)); // Clear immediately so piece merges smoothly
    animationProgress = 1.0;
    gameActive = false; // Pause active game drops during animation
    
    let rowCount = rowsToClear.length;
    player.lines += rowCount;
    player.level = Math.floor(player.lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
    
    if(rowCount === 1) player.score += 40 * player.level;
    if(rowCount === 2) player.score += 100 * player.level;
    if(rowCount === 3) player.score += 300 * player.level;
    if(rowCount === 4) player.score += 1200 * player.level;
    
    updateScore();
    return true; 
  }
  return false;
}

function updateScore() {
  document.getElementById('scoreVal').innerText = player.score;
  document.getElementById('levelVal').innerText = player.level;
  document.getElementById('linesVal').innerText = player.lines;
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  // Handle high FPS shrink animation first
  if (animationProgress > 0) {
    animationProgress -= deltaTime / 350; // 350ms duration
    if (animationProgress <= 0) {
      animationProgress = 0;
      // Perform the actual array splice AFTER animation finishes
      animatingRows.sort((a,b) => b.y - a.y); 
      animatingRows.forEach(item => {
        arena.splice(item.y, 1);
        arena.unshift(new Array(15).fill(0));
      });
      animatingRows = [];
      gameActive = true; 
      playerReset(); // Spawn next piece now that board is clear
    }
  } else if (gameActive) {
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) { playerDrop(); }
  }
  
  draw();
  animationId = requestAnimationFrame(update);
}

function initGame() {
  arena.forEach(row => row.fill(0));
  player.score = 0; player.lines = 0; player.level = 1; dropInterval = 1000; nextPiece = null;
  animationProgress = 0; animatingRows = [];
  updateScore(); playerReset();
  gameActive = true; lastTime = performance.now();
  if(animationId) cancelAnimationFrame(animationId);
  update();
}

function pauseGame() {
  gameActive = false; if(animationId) cancelAnimationFrame(animationId);
}

/* --- CONTROLS: BULLETPROOF SINGLE-TAP --- */

// Keyboard
document.addEventListener('keydown', event => {
  if(!gameActive) return;
  // Block continuous movement if the user holds the key down physically
  if (event.repeat) return; 

  if (event.keyCode === 37) { playerMove(-1); }
  else if (event.keyCode === 39) { playerMove(1); }
  else if (event.keyCode === 40) { playerDrop(); }
  else if (event.keyCode === 38) { playerRotate(1); }
  else if (event.keyCode === 32) { hardDrop(); }
});

// Mobile Buttons
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnRotate = document.getElementById("btnRotate");
const btnDrop = document.getElementById("btnDrop");

// Function to strictly lock buttons to a single immediate fire per tap/click
const setupSingleTap = (btn, action) => {
  btn.addEventListener("touchstart", e => {
    e.preventDefault(); // Completely stops double firing on mobile
    if(gameActive) action();
  }, {passive: false});
  
  btn.addEventListener("mousedown", e => {
    e.preventDefault(); // Ensures clean single clicks on desktop testing
    if(gameActive) action();
  });
};

setupSingleTap(btnLeft, () => playerMove(-1));
setupSingleTap(btnRight, () => playerMove(1));
setupSingleTap(btnRotate, () => playerRotate(1));
setupSingleTap(btnDrop, () => playerDrop());