// Force safe return if browser restores cached blank page
window.addEventListener("pageshow", e=>{
    if(e.persisted){
        window.location.href="index.html";
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

/* ---------- PARTICLES ---------- */
const canvas=document.getElementById("bgParticles");
const ctx=canvas.getContext("2d");

function resizeCanvas(){
    canvas.width=innerWidth;
    canvas.height=innerHeight;
}
resizeCanvas();
addEventListener("resize",resizeCanvas);
addEventListener("orientationchange",resizeCanvas);

let particles=[];
for(let i=0;i<60;i++){
    particles.push({
        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,
        r:Math.random()*2+1,
        dx:(Math.random()-.5)*0.4,
        dy:(Math.random()-.5)*0.4
    });
}

function drawParticles(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle="rgba(0,229,255,.7)";
        ctx.fill();
        p.x+=p.dx;
        p.y+=p.dy;
        if(p.x<0||p.x>canvas.width)p.dx*=-1;
        if(p.y<0||p.y>canvas.height)p.dy*=-1;
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();

/* ---------- GAME STATE ---------- */
let board=[],size=3,turn="X",mode="pvp",aiLevel="easy";
let scores={X:0,O:0},roundOver=false;
let currentWinPattern = null; 

const status=document.getElementById("status");
const backBtn=document.getElementById("backBtn");
const labelX=document.getElementById("labelX");
const labelO=document.getElementById("labelO");
const scoreX=document.getElementById("scoreX");
const scoreO=document.getElementById("scoreO");
const cardX=document.getElementById("cardX");
const cardO=document.getElementById("cardO");

const winCanvas=document.getElementById("winLine");
const winCtx=winCanvas.getContext("2d");

/* ---------- SCREENS & HISTORY NAVIGATION ---------- */
const screens=["screenMode","screenDifficulty","screenSize","screenNames","screenGame"];
let currentScreen="screenMode";

window.addEventListener("load",()=>{
    history.replaceState({screen:"screenMode"},"","#screenMode");
});

window.addEventListener("popstate",(e)=>{
    const s=e.state?.screen||"screenMode";
    show(s,true); 
});

function show(id, skip=false){
    screens.forEach(s=>document.getElementById(s).classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    currentScreen = id;
    if(!skip) {
        history.pushState({screen: id}, "", "#" + id);
    }
}

/* ---------- BACK BUTTON ---------- */
function goBack(){
    if (currentScreen === "screenMode") {
        window.location.href="index.html"; 
    } else {
        history.back(); 
    }
}

/* ---------- FLOW ---------- */
function selectMode(m){
    mode=m;
    resetScores();
    m==="ai"?show("screenDifficulty"):show("screenSize");
}

function setDifficulty(l){
    aiLevel=l;
    show("screenSize");
}

function setSize(s){
    size=s;
    resetScores();
    if(mode==="pvp") {
        show("screenNames");
    } else {
        labelX.textContent="Player";
        labelO.textContent="AI";
        show("screenGame");
        startGame();
    }
}

function saveNames(){
    labelX.textContent=document.getElementById("nameX").value||"Player X";
    labelO.textContent=document.getElementById("nameO").value||"Player O";
    show("screenGame");
    startGame();
}

function resetMatch() {
    resetScores();
    startGame();
}

/* ---------- NEW POPUP LOGIC ---------- */
function showRules() {
    document.getElementById("rulesPopup").classList.add("show");
}

function hideRules() {
    document.getElementById("rulesPopup").classList.remove("show");
}

function showWinPopup(msg, player) {
    const popup = document.getElementById("winPopup");
    const msgEl = document.getElementById("winMessage");
    
    msgEl.textContent = msg;
    
    if (player === "X") msgEl.style.color = "#00e5ff";
    else if (player === "O") msgEl.style.color = "#7c4dff";
    else msgEl.style.color = "#fff";
    
    popup.classList.add("show");
}

function hideWinPopup() {
    document.getElementById("winPopup").classList.remove("show");
}

/* ---------- GAME ---------- */
function startGame(){
    board=Array(size*size).fill("");
    turn="X";
    roundOver=false;
    clearWinLine();
    hideWinPopup(); 
    draw();
    updateTurnUI();
    status.textContent="Turn: "+turn;
}

function draw(){
    const b=document.getElementById("board");
    b.style.gridTemplateColumns=`repeat(${size},1fr)`;
    b.style.gridTemplateRows=`repeat(${size},1fr)`;
    b.innerHTML="";

    board.forEach((v,i)=>{
        const c=document.createElement("div");
        c.className="cell";
        
        if(v === "X") c.innerHTML = `<span style="color: #00e5ff;">X</span>`;
        if(v === "O") c.innerHTML = `<span style="color: #7c4dff;">O</span>`;
        
        if(v) c.classList.add("pop");
        
        c.onclick = () => {
            if (mode === "ai" && turn === "O") return;
            move(i);
        };
        b.appendChild(c);
    });

    setTimeout(resizeWinCanvas, 50); 
}

function move(i){
    if(roundOver||board[i]) return;
    board[i]=turn;
    draw();

    let winInfo=checkWin(turn);
    if(winInfo){handleWin(winInfo,turn);return;}

    if(board.every(x=>x)){
        roundOver=true;
        status.textContent="Draw";
        showWinPopup("It's a Draw!", "Draw");
        setTimeout(startGame,3000); 
        return;
    }

    turn=turn==="X"?"O":"X";
    updateTurnUI();
    status.textContent="Turn: "+turn;

    if(mode==="ai"&&turn==="O") setTimeout(aiMove,350);
}

function handleWin(info,player){
    roundOver=true;
    scores[player]++;
    updateScores();
    drawWinLine(info.cells);
    
    let playerName = player === "X" ? labelX.textContent : labelO.textContent;
    let msg = playerName + " Wins!";
    
    status.textContent = msg;
    showWinPopup(msg, player);
    
    setTimeout(startGame,3000); 
}

/* ---------- WIN CHECK ---------- */
function checkWin(player){
    const needed=size<=3?3:4;
    for(let r=0;r<size;r++){
        for(let c=0;c<size;c++){
            const dirs=[[1,0],[0,1],[1,1],[1,-1]];
            for(const[dR,dC]of dirs){
                let cells=[];
                for(let k=0;k<needed;k++){
                    let rr=r+dR*k;
                    let cc=c+dC*k;
                    if(rr<0||cc<0||rr>=size||cc>=size) break;
                    if(board[rr*size+cc]!==player) break;
                    cells.push(rr*size+cc);
                }
                if(cells.length===needed) return{cells};
            }
        }
    }
    return null;
}

/* ---------- WIN LINE ---------- */
function resizeWinCanvas(){
    const wrap=document.getElementById("boardWrap");
    if(wrap) {
        winCanvas.width=wrap.clientWidth;
        winCanvas.height=wrap.clientHeight;
        if (currentWinPattern) {
            drawWinLineStroke(currentWinPattern);
        }
    }
}
window.addEventListener("resize",resizeWinCanvas);
window.addEventListener("orientationchange",resizeWinCanvas);

function clearWinLine(){
    currentWinPattern = null;
    winCtx.clearRect(0,0,winCanvas.width,winCanvas.height);
}

function drawWinLine(pattern){
    currentWinPattern = pattern;
    resizeWinCanvas(); 
}

function drawWinLineStroke(pattern){
    if (!pattern) return;
    const cell=winCanvas.width/size;
    const pos=i=>({x:(i%size+0.5)*cell,y:(Math.floor(i/size)+0.5)*cell});
    const a=pos(pattern[0]);
    const b=pos(pattern[pattern.length-1]);
    
    winCtx.strokeStyle="rgba(0,229,255,.9)";
    winCtx.lineCap="round";
    winCtx.lineWidth=8;
    winCtx.beginPath();
    winCtx.moveTo(a.x,a.y);
    winCtx.lineTo(b.x,b.y);
    winCtx.stroke();
}

/* ---------- HELPERS ---------- */
function resetScores(){
    scores={X:0,O:0};
    updateScores();
}
function updateScores(){
    scoreX.textContent=scores.X;
    scoreO.textContent=scores.O;
}
function updateTurnUI(){
    cardX.style.opacity=turn==="X"?1:.4;
    cardX.style.transform=turn==="X"?"scale(1.05)":"scale(1)";
    
    cardO.style.opacity=turn==="O"?1:.4;
    cardO.style.transform=turn==="O"?"scale(1.05)":"scale(1)";
}

/* ---------- AI LOGIC ---------- */
function aiMove(){
    if(roundOver) return;

    let empty = board.map((v,i) => v === "" ? i : null).filter(v => v !== null);
    if(empty.length === 0) return;

    let chosen = null;
    let level = (aiLevel || "easy").toLowerCase(); 

    if (level === "easy") {
        chosen = empty[Math.floor(Math.random() * empty.length)];
    } else {
        let winMove = findWinningMove("O");
        let blockMove = findWinningMove("X");

        if (winMove !== null) {
            chosen = winMove;
        } else if (blockMove !== null) {
            chosen = blockMove;
        } else {
            if (level === "medium") {
                chosen = empty[Math.floor(Math.random() * empty.length)];
            } else {
                let center = Math.floor(size / 2) * size + Math.floor(size / 2);
                if (board[center] === "") {
                    chosen = center;
                } else {
                    let corners = [0, size - 1, size * (size - 1), (size * size) - 1].filter(c => board[c] === "");
                    if (corners.length > 0) {
                        chosen = corners[Math.floor(Math.random() * corners.length)];
                    } else {
                        chosen = empty[Math.floor(Math.random() * empty.length)];
                    }
                }
            }
        }
    }

    if (chosen !== null) {
        move(chosen);
    } else {
        move(empty[Math.floor(Math.random() * empty.length)]);
    }
}

function findWinningMove(player) {
    let empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    for (let i of empty) {
        board[i] = player; 
        let win = checkWin(player);
        board[i] = ""; 
        if (win) return i;
    }
    return null;
}