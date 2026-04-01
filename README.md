AIrena – A Game That Learns With You
Live Demo: [https://kai001521.github.io/AIrena_new/](https://kai001521.github.io/AIrena_new/)
Project Report (Black Book): 

Overview:-
"AIrena" is a browser-based multi-game platform powered by "adaptive artificial intelligence". It combines classic strategy games into a single interactive system where the AI evolves based on player behavior.

Unlike traditional games with fixed difficulty levels, AIrena introduces a "dynamic AI opponent" that "learns, adapts, and improves over time", making every gameplay session unique.

Key Features:-
1) Multi-Game Platform
    * Tic Tac Toe
    * Checkers
    * Chess
    * Dots & Boxes
    * Memory Game *(as seen in implementation)*

2) Adaptive AI System
    * Learns from player moves
    * Adjusts difficulty dynamically
    * Uses:
      * Minimax Algorithm
      * Pattern Recognition
      * Predictive Move Analysis

3) Gameplay Modes
    * Player vs Player (PvP)
    * Player vs AI (PvAI)

4) UI/UX Features
    * Dark / Light Mode 🌙☀️
    * Smooth animations
    * Responsive design (mobile + desktop)
    * Clean and modern interface

5) Smart Storage
    * Uses "Local Storage"
    * Saves:
      * Player scores
      * Game progress
      * Settings

How the AI Works:-
AIrena doesn’t just play — it "learns".
1) Core Logic:
    * Detects winning moves
    * Blocks opponent strategies
    * Uses Minimax for optimal decisions
    * Tracks player patterns
    * Predicts future moves

2) Adaptive Behavior:
| Player Performance | AI Behavior       |
| ------------------ | ----------------- |
| Player wins often  | AI becomes harder |
| Balanced gameplay  | AI uses strategy  |
| Player improves    | AI adapts further |

3) Tech Stack
| Technology        | Purpose              |
| ----------------- | -------------------- |
| HTML5             | Structure            |
| CSS3              | Styling & animations |
| JavaScript (ES6+) | Game logic & AI      |
| Local Storage     | Data persistence     |
| VS Code           | Development          |

4) System Architecture
    * Frontend UI (HTML/CSS/JS)
    * Navigation Manager
    * Game Engine Core
    * AI Decision Module
    * Game State Manager
    * Local Storage System

Entire system runs "client-side (no backend required)" 
1) Core Modules
    * Game Engine Core
    * AI Decision System
    * Navigation Manager
    * Score Manager
    * Game State Manager
  
2) Performance
| Metric           | Result                |
| ---------------- | --------------------- |
| Page Load Time   | < 2 sec               |
| AI Decision Time | < 100 ms              |
| Response Time    | Instant               |
| Browser Support  | Chrome, Edge, Firefox |

3) Project Structure (Typical)
```
AIrena/
│
├── index.html
├── style.css
├── script.js
├── games/
│   ├── tictactoe.js
│   ├── checkers.js
│   ├── chess.js
│   ├── dotsandboxes.js
│
├── assets/
│   ├── images/
│   ├── animations/
│
└── README.md
```

4) How to Run Locally
```bash
# Step 1: Clone repository
git clone https://github.com/your-username/AIrena.git

# Step 2: Open folder
cd AIrena

# Step 3: Run
Open index.html in browser
```

* No installation required
* Works offline after loading

5) Objectives Achieved
    * Built a "multi-game web platform"
    * Implemented "adaptive AI"
    * Created "responsive UI"
    * Demonstrated "AI in browser environment"
    * Ensured "lightweight and fast performance"

6) Future Enhancements
    * Online multiplayer
    * User authentication system  
    * Leaderboards
    * Cloud storage
    * Advanced AI (ML-based)

7) Limitations
    * No backend (limited to local storage)
    * No real-time multiplayer
    * AI is heuristic-based (not deep learning)

**Author**
Aayush Akhilesh Patel
B.Sc IT – University of Mumbai
JES College of Commerce, Science & IT

**License**
This project is for "educational purposes".
You are free to use and modify with proper credit.

**Final Note**
AIrena is not just a game:
it’s a demonstration of how "intelligent systems can evolve inside simple web environments"
