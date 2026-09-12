# ⏳ ECHO PROTOCOL // Tactical Temporal Breach
> **3D Tactical Time-Loop Action Game Engine**  
> *Engineered by [Mehmet Karabulut](https://mehmetkarabul7tt.com.tr) — Computer Engineering Student*  
> **Live Demo:** [Playable in Browser](https://mehmetkarabul7tt.com.tr/demos/echo-protocol/index.html)

---

## 🎯 Project Overview
**ECHO PROTOCOL** is an innovative 3D tactical action game engine built from scratch using **Three.js, WebGL, and the Web Audio API**. Unlike traditional single-agent shooters, ECHO PROTOCOL features a **Deterministic State & Input Replay Engine**:

The player operates within a **12-second temporal loop**. In Loop 1 (*Alpha*), the player initiates actions—luring heavy turret fire, stepping on remote pressure switches, or flanking defense lines. When the loop rewinds, a **sub-frame holographic ghost clone** is instantiated, executing the exact recorded trajectory and weapon discharges with mathematical precision while the player (*Beta / Gamma*) coordinates simultaneous multi-angle strikes.

```
+-------------------------------------------------------------------------+
|                          TEMPORAL REPLAY LOOP                           |
|                                                                         |
|  [Timeline 1: Alpha] ---> Record Fixed-Tick Input / Transform Buffer    |
|                                     |                                   |
|                            [12.0s Rewind Trigger]                       |
|                                     |                                   |
|  [Timeline 2: Beta]  ---> Instantiate Ghost Alpha (Hologram Replay)     |
|                      ---> Player controls Beta (Dual Strike)            |
|                                     |                                   |
|  [Timeline 3: Gamma] ---> Ghost Alpha + Ghost Beta + Player Gamma       |
|                           (3-Operative Coordinated Heist Breach)        |
+-------------------------------------------------------------------------+
```

---

## 🏗️ Architectural Overview

```
src/
├── core/
│   ├── AudioEngine.js      # Procedural Web Audio synthesizer (zero MP3s)
│   ├── ChronoBuffer.js     # Fixed-tick deterministic recording ring buffer
│   └── ProjectilePool.js   # Zero-GC projectile & particle memory pools
├── entities/
│   ├── Operative.js        # Articulated chassis, dash & aiming controller
│   └── Sentinels.js        # FSM AI (drones, automated turrets, Omega boss)
├── world/
│   ├── FacilityMap.js      # Procedural metallic floor & architecture
│   └── SecuritySystems.js  # Pressure switches, laser gates & data nexus
├── ui/
│   └── TacticalHUD.js      # Real-time telemetry, hitmarkers & chrono tracks
└── main.js                 # 60 FPS fixed game loop & stage orchestrator
```

---

## 🚀 Key Engineering & Technical Highlights

### 1. Deterministic State & Input Recording Ring Buffer
- Samples agent transforms $(x, z, 	heta_y)$, projectile discharges, dash states, and terminal hack triggers at a fixed tick rate.
- Ghost playback employs **sub-frame linear interpolation (LERP)** for spatial translation and **quaternion slerp** for rotation, eliminating visual jitter.
- Demonstrates direct architectural parallels to **Client Prediction & Deterministic Lockstep Netcode** in modern multiplayer game engines.

### 2. Zero-GC (Garbage Collection) Object Pooling
- Dynamically manages a pre-allocated pool of 160+ projectiles and 240+ kinetic particles.
- Prevents Garbage Collector pauses to sustain an uncompromising **60 FPS** on both desktop and mobile devices.

### 3. Reactive Decoy & Multi-Agent AI (FSM)
- Security Drones and Heavy Rampart Turrets run a Finite State Machine (`PATROL` -> `TARGET_ACQUISITION` -> `BURST_FIRE` -> `DESTROYED`).
- Dynamic target acquisition prioritizes the closest active spatial entity—allowing the player to deliberately use past ghost recordings as sacrificial decoys and bullet sponges.

### 4. Game Feel & "Juice" Implementation
- **Trauma-Based Screen Shake:** Quadratic decay formula ($Trauma^2$) for organic camera shake on explosions and temporal rewinds.
- **Selective Post-Processing Bloom:** UnrealBloomPass highlights lasers, holographic shields, and cyber terminals.
- **Procedural Audio Synthesizer:** Real-time FM/sub-bass oscillator sound effects without external audio files.

---

## 🎮 Controls
- **WASD:** Move
- **Left Mouse Click:** Fire Plasma Discharge
- **Spacebar:** Thruster Boost Dash
- **E:** Hack / Override Security Nexus
- **R:** Manual Paradox Rewind (Early Loop Reset)

---

## 💻 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/karabul7tt/echo-protocol.git

# Navigate into the project
cd echo-protocol

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 📄 License
MIT License. Created by [Mehmet Karabulut](https://mehmetkarabul7tt.com.tr).
