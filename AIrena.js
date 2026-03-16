document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-enter");
});

// Fades the loader OUT when you first open the hub and handles Smart Autoplay
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => { loader.classList.add("fade-out"); }, 500);
    }

    /* ===== SMART AUTOPLAY MUSIC ===== */
    const bgMusic = document.getElementById("bgMusic");
    if (bgMusic) {
        bgMusic.volume = 0.4; // Set volume to 40%
        
        // Attempt to play immediately on load
        let playPromise = bgMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Browser blocked autoplay. Waiting for user to tap the screen.");
                // Fallback: If the browser blocks it (usually on the first page load), 
                // wait for the player to tap anywhere to start the music.
                document.body.addEventListener("click", () => {
                    if (bgMusic.paused) {
                        bgMusic.play();
                        // Update mute button to "unmuted" state
                        const muteBtn = document.getElementById("muteBtn");
                        if(muteBtn) muteBtn.classList.remove("muted");
                    }
                }, { once: true });
            });
        }
    }
});

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");


/* ===== FIX FOR MOBILE BACK GESTURE (BFCache) ===== */
window.addEventListener("pageshow", (event) => {
    // event.persisted is true if the page is loaded from the browser's back/forward cache
    if (event.persisted) {
        const loader = document.getElementById("loader");
        if (loader) {
            // Remove the loading screen immediately when swiping back
            loader.classList.add("fade-out");
        }
    }
});


function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let particles = [];
for (let i = 0; i < 100; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 2 + 0.5,
    dx: (Math.random() - 0.5) * 0.3,
    dy: (Math.random() - 0.5) * 0.3
  });
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
  });
  requestAnimationFrame(animate);
}
animate();

/* ===== TRANSITION ANIMATION LOGIC ===== */
function launchGame(url) {
  // Fades the loader BACK IN when a game is clicked
  const loader = document.getElementById("loader");
  if (loader) {
      loader.classList.remove("fade-out");
  }
  
  // Waits for the animation to cover the screen (600ms), then loads the next page
  setTimeout(() => { 
      window.location.href = url; 
  }, 600);
}

function opentictactoe() { launchGame("tictactoe.html"); }
function openMemory() { launchGame("memory.html"); }
function openCheckers() { launchGame("checkers.html"); }
function openDots() { launchGame("dotsNboxes.html"); }
function openTetris() { launchGame("tetris.html"); }
function openLogin() { launchGame("login.html"); } 

/* ===== AGGRESSIVE MUSIC AUTOPLAY FIX ===== */
window.addEventListener("DOMContentLoaded", () => {
    const bgMusic = document.getElementById("bgMusic");
    if (!bgMusic) return;
    
    bgMusic.volume = 0.4; // 40% volume

    // 1. Try to play immediately (Works if they navigated from another page on your site)
    const playAttempt = bgMusic.play();
    
    if (playAttempt !== undefined) {
        playAttempt.catch(error => {
            console.log("Browser blocked auto-play. Waiting for first tap...");
            
            // 2. If blocked, force it to start on the absolute FIRST touch or click
            const startMusic = () => {
                bgMusic.play();
                const muteBtn = document.getElementById("muteBtn");
                if(muteBtn) muteBtn.classList.remove("muted");
                
                // Remove the listeners once music starts so it doesn't run repeatedly
                document.removeEventListener("click", startMusic);
                document.removeEventListener("touchstart", startMusic);
            };

            document.addEventListener("click", startMusic);
            document.addEventListener("touchstart", startMusic);
        });
    }
});

/* ===== MUSIC TOGGLE LOGIC ===== */
function toggleMusic() {
    const bgMusic = document.getElementById("bgMusic");
    const muteBtn = document.getElementById("muteBtn");
    
    if (bgMusic.paused) {
        bgMusic.play();
        muteBtn.classList.remove("muted"); // Shows unmuted SVG
    } else {
        bgMusic.pause();
        muteBtn.classList.add("muted");    // Shows muted SVG (turns red)
    }
}