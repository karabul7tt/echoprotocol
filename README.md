# Echo Protocol

A 3D top-down tactical action game prototype made with Three.js and the Web Audio API.

**Live Demo:** [https://karabul7tt.github.io/echo-protocol/](https://karabul7tt.github.io/echo-protocol/)

The main mechanic is a 12-second time loop. In each run, your actions (movement, rotation, shooting, and abilities) are recorded every tick. When the timer runs out or when you take fatal damage, time rewinds. In the next loop, a holographic ghost clone of your previous run replays beside you, allowing you to trigger switches, distract sentries, and flank enemies together.

## How it Works

1. Loop 1: You move forward, step on a pressure switch, or take enemy fire.
2. Loop 2: A ghost clone replays your exact path and shots. You can use it as a distraction to flank enemies or hit the second switch.
3. Loop 3: You fight alongside two past clones to breach the mainframe and destroy the boss mech.

## Project Structure

src/
├── main.js       # Game loop and level manager
├── player.js     # Player movement, dash, and aiming
├── ghost.js      # Input and transform recording / replay
├── enemy.js      # Enemy AI (drones, turrets, boss)
├── bullets.js    # Bullet and particle object pool
├── map.js        # Procedural floor, walls, and switches
├── audio.js      # Sound effects using Web Audio API
└── ui.js         # Health bars and hit markers

## Technical Details

- Time Loop System: Samples player transform and inputs at fixed ticks, then uses Vector3.lerp for smooth ghost playback.
- Object Pooling: Bullets and particles are pre-allocated to avoid garbage collection spikes and keep a steady 60 FPS.
- Procedural Audio: All sound effects (shots, hit markers, explosions, rewind sweeps) are synthesized in code using the Web Audio API without any external audio files.
- Visuals: Three.js PCF soft shadows, procedural canvas floor textures, and subtle bloom post-processing.

## Controls

- WASD: Move
- Left Click: Shoot
- Space: Dash
- E: Interact / Hack
- R: Rewind loop manually

## Setup

npm install
npm run dev

## Author

Mehmet Karabulut
