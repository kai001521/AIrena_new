// Force safe return if browser tries to restore cached blank page
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

/* ===== PARTICLES ENGINE ===== */
const particleCanvas=document.getElementById("particles");
const pctx=particleCanvas.getContext("2d");

function resizeParticles(){
    particleCanvas.width=window.innerWidth;
    particleCanvas.height=window.innerHeight;
}
resizeParticles();
window.addEventListener("resize",resizeParticles);

const particles=[];
for(let i=0;i<80;i++){
    particles.push({
        x:Math.random()*particleCanvas.width,
        y:Math.random()*particleCanvas.height,
        r:Math.random()*2+1,
        dx:(Math.random()-0.5)*0.4,
        dy:(Math.random()-0.5)*0.4
    });
}

function drawParticles(){
    pctx.clearRect(0,0,particleCanvas.width,particleCanvas.height);
    pctx.fillStyle="rgba(255,60,60,0.7)";
    particles.forEach(p=>{
        pctx.beginPath();
        pctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        pctx.fill();
        p.x+=p.dx;
        p.y+=p.dy;
        if(p.x<0||p.x>particleCanvas.width)p.dx*=-1;
        if(p.y<0||p.y>particleCanvas.height)p.dy*=-1;
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();

/* ===== ELEMENTS ===== */
const modeScreen=document.getElementById("modeScreen");
const difficultyScreen=document.getElementById("difficultyScreen");
const namingScreen=document.getElementById("namingScreen");
const gameUI=document.getElementById("gameUI");
const board=document.getElementById("board");
const redScoreEl=document.getElementById("redScore");
const whiteScoreEl=document.getElementById("whiteScore");

/* ===== STATE ===== */
let currentScreen="mode";
let gameMode="pvp";
let difficulty="easy";
let playerRed="Red";
let playerWhite="White";
let currentPlayer="red";
let squares=[];
let selectedSquare=null;
let redScore=12;
let whiteScore=12;
let gameOver=false;

/* ===== HISTORY NAVIGATION SYSTEM ===== */

function push(screen){
    history.pushState({screen:screen},"","#"+screen);
}

function showMode(skip=false){
    currentScreen = "mode";
    modeScreen.style.display="flex";
    difficultyScreen.style.display="none";
    namingScreen.style.display="none";
    gameUI.style.display="none";
    if(!skip) push("mode");
}

function showDifficulty(skip=false){
    currentScreen = "difficulty";
    modeScreen.style.display="none";
    difficultyScreen.style.display="flex";
    namingScreen.style.display="none";
    gameUI.style.display="none";
    if(!skip) push("difficulty");
}

function goNaming(skip=false){
    gameMode="pvp";
    currentScreen = "naming";
    modeScreen.style.display="none";
    difficultyScreen.style.display="none";
    namingScreen.style.display="flex";
    gameUI.style.display="none";
    if(!skip) push("naming");
}

function showGame(skip=false){
    currentScreen = "game";
    modeScreen.style.display="none";
    difficultyScreen.style.display="none";
    namingScreen.style.display="none";
    gameUI.style.display="flex";
    if(!skip) push("game");
}

window.addEventListener("load",()=>{
    history.replaceState({screen:"mode"},"","#mode");
});

window.addEventListener("popstate",(e)=>{
    const s = e.state?.screen || "mode";
    currentScreen = s; 
    
    if(s==="mode") showMode(true);
    if(s==="difficulty") showDifficulty(true);
    if(s==="naming") goNaming(true);
    if(s==="game") showGame(true);
});

/* ===== POPUP LOGIC ===== */
function showRules() {
    document.getElementById("rulesPopup").classList.add("show");
}

function hideRules() {
    document.getElementById("rulesPopup").classList.remove("show");
}

function goMenu() {
    document.getElementById("winPopup").classList.remove("show");
    showMode(); 
}

/* ===== BACK BUTTON ===== */
function goBack(){
    if (currentScreen === "mode") {
        window.location.href = "index.html";
    } else {
        history.back();
    }
}

/* ===== GAME START ===== */
function startAI(level){
    difficulty=level;
    gameMode="ai";
    playerRed="Player";
    playerWhite="AI";
    document.getElementById("nameRed").textContent=playerRed;
    document.getElementById("nameWhite").textContent=playerWhite;
    showGame();
    buildBoard();
}

function startGame(){
    playerRed=document.getElementById("p1").value||"Red";
    playerWhite=document.getElementById("p2").value||"White";
    document.getElementById("nameRed").textContent=playerRed;
    document.getElementById("nameWhite").textContent=playerWhite;
    showGame();
    buildBoard();
}

/* ===== BOARD BUILD ===== */
function buildBoard(){
    board.innerHTML="";
    squares=[];
    redScore=12;
    whiteScore=12;
    currentPlayer="red";
    gameOver=false;
    document.getElementById("winPopup").classList.remove("show"); // Ensure popup is hidden on restart

    updateScore();
    updateTurnUI();

    for(let r=0;r<8;r++){
        for(let c=0;c<8;c++){
            const sq=document.createElement("div");
            sq.className="square "+((r+c)%2?"dark":"light");
            sq.dataset.row=r;
            sq.dataset.col=c;

            if((r+c)%2){
                if(r<3)sq.appendChild(createPiece("white"));
                if(r>4)sq.appendChild(createPiece("red"));
            }

            sq.onclick=()=>handleClick(sq);
            board.appendChild(sq);
            squares.push(sq);
        }
    }
}

function createPiece(color){
    const p=document.createElement("div");
    p.className="piece "+color;
    return p;
}

/* ===== CLICK ===== */
function handleClick(square){
    if(gameOver)return;
    if(gameMode==="ai"&&currentPlayer==="white")return;

    const piece=square.querySelector(".piece");

    if(!selectedSquare){
        if(piece&&piece.classList.contains(currentPlayer))select(square);
        return;
    }
    if(square===selectedSquare){clearSelection();return;}
    if(piece&&piece.classList.contains(currentPlayer)){select(square);return;}

    attemptMove(selectedSquare,square);
}

function select(s){
    clearSelection();
    selectedSquare=s;
    s.querySelector(".piece").classList.add("selected");
}
function clearSelection(){
    document.querySelectorAll(".piece").forEach(p=>p.classList.remove("selected"));
    selectedSquare=null;
}

/* ===== SAFE ANIMATION MOVE ===== */
function smoothMove(from,to,callback){
    const piece=from.querySelector(".piece");
    const start=piece.getBoundingClientRect();
    const end=to.getBoundingClientRect();

    const clone=piece.cloneNode(true);
    clone.style.position="fixed";
    clone.style.left=start.left+"px";
    clone.style.top=start.top+"px";
    clone.style.width=start.width+"px";
    clone.style.height=start.height+"px";
    clone.style.zIndex="9999";
    clone.style.pointerEvents="none";
    clone.style.transition="transform 0.28s cubic-bezier(.2,.8,.3,1)";
    document.body.appendChild(clone);

    to.appendChild(piece);
    piece.style.opacity="0";

    const dx=end.left-start.left;
    const dy=end.top-start.top;

    requestAnimationFrame(()=>clone.style.transform=`translate(${dx}px,${dy}px)`);

    setTimeout(()=>{
        clone.remove();
        piece.style.opacity="1";
        callback();
    },300);
}

/* ===== MOVE LOGIC ===== */
function attemptMove(from,to){
    const fr=+from.dataset.row,fc=+from.dataset.col;
    const tr=+to.dataset.row,tc=+to.dataset.col;
    const piece=from.querySelector(".piece");
    if(to.querySelector(".piece"))return;

    const king=piece.classList.contains("king");
    let dirs=[];
    if(currentPlayer==="red"||king)dirs.push(-1);
    if(currentPlayer==="white"||king)dirs.push(1);

    for(const d of dirs){
        if(Math.abs(tc-fc)===1&&tr-fr===d){
            smoothMove(from,to,()=>{checkPromotion(to);switchTurn();});
            return;
        }

        if(Math.abs(tc-fc)===2&&tr-fr===d*2){
            const mr=(fr+tr)/2,mc=(fc+tc)/2;
            const mid=squares.find(s=>+s.dataset.row===mr&&+s.dataset.col===mc);
            const mp=mid?.querySelector(".piece");

            if(mp&&!mp.classList.contains(currentPlayer)){
                smoothMove(from,to,()=>{
                    mid.removeChild(mp);
                    if(mp.classList.contains("red"))redScore--;
                    else whiteScore--;
                    updateScore();
                    checkWin();
                    checkPromotion(to);
                    switchTurn();
                });
                return;
            }
        }
    }
}

/* ===== PROMOTION ===== */
function checkPromotion(s){
    const r=+s.dataset.row;
    const p=s.querySelector(".piece");
    if(!p)return;
    if(p.classList.contains("red")&&r===0)p.classList.add("king");
    if(p.classList.contains("white")&&r===7)p.classList.add("king");
}

/* ===== TURN ===== */
function switchTurn(){
    if(gameOver) return;
    currentPlayer=currentPlayer==="red"?"white":"red";
    updateTurnUI();
    if(gameMode==="ai"&&currentPlayer==="white"&&!gameOver){
        setTimeout(aiMove,300);
    }
}

function updateTurnUI(){
    document.getElementById("playerRed").classList.toggle("active",currentPlayer==="red");
    document.getElementById("playerWhite").classList.toggle("active",currentPlayer==="white");
}

function updateScore(){
    redScoreEl.textContent=redScore;
    whiteScoreEl.textContent=whiteScore;
}

/* ===== AI ===== */
function aiMove(){
    let moves=[],captures=[];
    
    squares.forEach(from=>{
        const piece=from.querySelector(".piece");
        if(!piece||!piece.classList.contains("white"))return;

        const fr=+from.dataset.row,fc=+from.dataset.col;
        const king=piece.classList.contains("king");
        let dirs=[1]; 
        if(king)dirs=[1,-1];

        dirs.forEach(d=>{
            [-1,1].forEach(dc=>{
                const step=squares.find(s=>+s.dataset.row===fr+d&&+s.dataset.col===fc+dc);
                if(step&&!step.querySelector(".piece")){
                    moves.push({from,to:step});
                }

                const mid=squares.find(s=>+s.dataset.row===fr+d&&+s.dataset.col===fc+dc);
                const jump=squares.find(s=>+s.dataset.row===fr+d*2&&+s.dataset.col===fc+dc*2);
                
                if(jump&&mid){
                    const mp=mid.querySelector(".piece");
                    if(mp&&mp.classList.contains("red")&&!jump.querySelector(".piece")){
                        captures.push({from,to:jump});
                    }
                }
            });
        });
    });

    if(moves.length===0&&captures.length===0)return;

    let chosenMove;

    if(difficulty==="easy"){
        const list=[...moves,...captures];
        chosenMove=list[Math.floor(Math.random()*list.length)];
    } 
    else if(difficulty==="medium"){
        const list=captures.length?captures:moves;
        chosenMove=list[Math.floor(Math.random()*list.length)];
    } 
    else if(difficulty==="hard"){
        const list=captures.length?captures:moves;
        list.sort((a,b)=>+b.to.dataset.row-+a.to.dataset.row);
        const bestScore=+list[0].to.dataset.row;
        const bestMoves=list.filter(m=>+m.to.dataset.row===bestScore);
        chosenMove=bestMoves[Math.floor(Math.random()*bestMoves.length)];
    }

    if(chosenMove){
        attemptMove(chosenMove.from,chosenMove.to);
    }
}

/* ===== WIN ===== */
function checkWin(){
    if(redScore===0)showWin(playerWhite,"white");
    if(whiteScore===0)showWin(playerRed,"red");
}

function showWin(name,color){
    gameOver=true;
    document.getElementById("winnerText").textContent=`${name} Wins!`;
    document.getElementById("winPieceDisplay").className=`piece ${color} winPiece`;
    document.getElementById("winPopup").classList.add("show");
}

function restartGame(){
    buildBoard();
}