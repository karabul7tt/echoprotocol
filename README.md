# Echo Protocol - 3D Time Loop Tactical Game

A 3D top-down action game prototype built from scratch with **Three.js**, **WebGL**, and the **Web Audio API**.

The core mechanic is a **12-second time loop**. You play through a room, and when time runs out (or when you die), time rewinds. In the next loop, a holographic ghost clone replays everything you did in the previous run — shooting, moving, and drawing enemy fire — so you can team up with your past self to clear security gates and defeat enemies.

---

## 🎮 Gameplay & Mechanics

1. **Loop 1 (Alpha):** Scout ahead, step on a pressure switch, or take enemy fire.
2. **Loop 2 (Beta):** Your past clone spawns and executes your previous run with sub-frame precision. You can now flank the enemies while they are distracted by your clone.
3. **Loop 3 (Gamma):** You fight alongside two past clones to breach the mainframe and destroy the heavy boss mech.

---

## 📁 Project Structure

Organized into modular ES6 modules:

```text
echo-protocol/
├── index.html          # Main HTML page & tactical HUD
├── package.json        # Dependencies (Three.js, Vite)
├── README.md           # Documentation
└── src/
    ├── main.js         # Game loop & stage manager
    ├── player.js       # Player movement, dash, and laser aiming
    ├── ghost.js        # Recording & replay system
    ├── enemy.js        # Enemy AI (drones, turrets, boss)
    ├── bullets.js      # Bullet & particle object pool (zero GC stutter)
    ├── map.js          # Procedural floor texture, walls, and switches
    ├── audio.js        # Procedural sound effects using Web Audio API
    └── ui.js           # Hit markers, damage numbers, and health bars
```

---

## 🛠️ Tech Stack & Key Implementations

- **Three.js & WebGL:** Custom lighting, PCF soft shadows, and UnrealBloom post-processing.
- **Input & Transform Replay System:** Records player position $(x, z)$, rotation, and weapon fire every tick, then interpolates with `Vector3.lerp` for smooth ghost playback.
- **Object Pooling:** Bullets and particles are pre-allocated in memory to avoid garbage collection spikes and keep a solid 60 FPS.
- **Procedural Audio:** All sound effects (laser shots, hit markers, explosions, rewind Doppler sweeps, and background rhythm) are synthesized in real time using the Web Audio API without external audio files.

---

## 🕹️ Controls

- **WASD / Arrow Keys:** Movement
- **Left Mouse Click:** Shoot
- **Space:** Dash / Thruster Boost
- **E:** Hack terminals
- **R:** Rewind loop manually

---

## 🚀 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/karabul7tt/echo-protocol.git

# Navigate into the folder
cd echo-protocol

# Install dependencies
npm install

# Start local development server
npm run dev
```

---

**Developed by Mehmet Karabulut**  
[GitHub Profile](https://github.com/karabul7tt) • [Portfolio](https://mehmetkarabul7tt.com.tr)
