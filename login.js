// --- FORM SLIDING LOGIC ---
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const btnSlide = document.getElementById("btn-slide");

function showRegister() {
    loginForm.style.transform = "translateX(-150%)"; // Slide left out of view
    registerForm.style.transform = "translateX(0)";  // Slide in from right
    // 120px is half the width (240) minus the 4px offset for the inner pill
    btnSlide.style.left = "calc(50% + 0px)"; 
}

function showLogin() {
    loginForm.style.transform = "translateX(0)";     // Slide back to center
    registerForm.style.transform = "translateX(150%)"; // Slide right out of view
    btnSlide.style.left = "4px"; // Move button toggle back
}

// Redirect logic
loginForm.addEventListener("submit", function(e) {
    e.preventDefault();
    window.location.href = "index.html"; 
});

registerForm.addEventListener("submit", function(e) {
    e.preventDefault();
    window.location.href = "index.html";
});


// --- PARTICLE BACKGROUND LOGIC ---
const canvas = document.getElementById("particle-canvas");
const ctx = canvas.getContext("2d");

let particlesArray = [];

// Handle canvas resizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Particle Class
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 1 - 0.5; 
        this.speedY = Math.random() * 1 - 0.5; 
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
        // Subtle cyan glow for particles
        ctx.fillStyle = "rgba(0, 229, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize particles
function initParticles() {
    particlesArray = [];
    // Adjust number of particles based on screen width (less on mobile for performance)
    let numberOfParticles = (canvas.width * canvas.height) / 8000;
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

// Connect particles with lines if they are close
function connectParticles() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let dx = particlesArray[a].x - particlesArray[b].x;
            let dy = particlesArray[a].y - particlesArray[b].y;
            let distance = dx * dx + dy * dy;

            if (distance < 12000) {
                let opacity = 1 - distance / 12000;
                // Cyan/Purple tinted connecting lines
                ctx.strokeStyle = `rgba(181, 60, 255, ${opacity * 0.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// Animation Loop
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    connectParticles();
    requestAnimationFrame(animateParticles);
}

// Start
initParticles();
animateParticles();

// Re-initialize particles if window resizes drastically
window.addEventListener('resize', initParticles);