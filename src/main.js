/**
 * ECHO PROTOCOL // TACTICAL TEMPORAL ENGINE (MAIN BOOTSTRAP)
 * Engineered by Mehmet Karabulut
 * Portfolio: https://mehmetkarabul7tt.com.tr | GitHub: https://github.com/karabul7tt
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { TacticalAudioEngine } from './core/AudioEngine.js';
import { ChronoBuffer }        from './core/ChronoBuffer.js';
import { ProjectilePool }      from './core/ProjectilePool.js';
import { Operative }           from './entities/Operative.js';
import { CyberEnemy }          from './entities/Sentinels.js';
import { FacilityMap }         from './world/FacilityMap.js';
import { PressurePlate, LaserGate, DataTerminal } from './world/SecuritySystems.js';
import { TacticalHUD }         from './ui/TacticalHUD.js';

/* 1. Global Systems Setup */
const audio = new TacticalAudioEngine();
const chronoBuffer = new ChronoBuffer();

const LOOP_DURATION = 12.0;
const MAX_TIMELINES = 3;

const GAME_STAGES = [
  {
    id: 1,
    name: 'FACILITY-SEC-01 // AUTOMATED VAULT INFILTRATION',
    objective: 'Depress Switch A & B with phantom clones to de-energize perimeter laser barrier, then hack Core Terminal!',
    bossHealth: 100
  },
  {
    id: 2,
    name: 'FACILITY-SEC-02 // PERIMETER DEFENSE RAMPART',
    objective: 'Coordinate with past ghost recordings to draw frontal sentry fire and flank the armored core!',
    bossHealth: 250
  },
  {
    id: 3,
    name: 'FACILITY-SEC-03 // OMEGA HEAVY MECH ENCOUNTER',
    objective: 'Execute synchronized multi-angle strike against the rotating heavy assault mech!',
    bossHealth: 500
  }
];

let currentStageIndex = 0;
let currentLoopIndex = 0;
let loopTimer = 0.0;
let isRewinding = false;
let rewindTimer = 0.0;
let isGameRunning = false;
let trauma = 0.0;

/* 2. Three.js Scene, Camera & Renderer */
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

// PCF Soft Shadow Mapping
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#06070a');
scene.fog = new THREE.FogExp2('#06070a', 0.02);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 36, 30);
camera.lookAt(0, 0, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.75, 0.3, 0.88
);
composer.addPass(bloomPass);

// Lighting
scene.add(new THREE.AmbientLight('#1b2230', 1.2));
const sunLight = new THREE.DirectionalLight('#f8fafc', 2.2);
sunLight.position.set(24, 45, 18);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const centerSpot = new THREE.SpotLight('#fbbf24', 2.0, 50, Math.PI / 4, 0.5, 1.2);
centerSpot.position.set(0, 22, -5);
centerSpot.target.position.set(0, 0, -5);
scene.add(centerSpot);
scene.add(centerSpot.target);

/* 3. Facility World & HUD */
const facility = new FacilityMap(scene);
const hud = new TacticalHUD(camera);
const projectilePool = new ProjectilePool(scene, 160);

/* 4. Operative & Ghosts */
const player = new Operative(scene, false);
const ghostAlpha = new Operative(scene, true, '#f59e0b');
const ghostBeta  = new Operative(scene, true, '#38bdf8');
ghostAlpha.mesh.visible = false;
ghostBeta.mesh.visible = false;

/* 5. Enemies & Interactive Systems */
let enemies = [];
let plates = [];
let laserGates = [];
let terminals = [];

function setupStage(stageIdx) {
  plates.forEach(p => scene.remove(p.group));
  laserGates.forEach(g => scene.remove(g.group));
  terminals.forEach(t => scene.remove(t.group));
  enemies.forEach(e => scene.remove(e.mesh));

  plates = [];
  laserGates = [];
  terminals = [];
  enemies = [];

  if (stageIdx === 0) {
    const pA = new PressurePlate(scene, 'ALPHA', -16, -14);
    const pB = new PressurePlate(scene, 'BETA', 16, -14);
    plates.push(pA, pB);
    laserGates.push(new LaserGate(scene, 0, -18, 14, [pA, pB]));
    terminals.push(new DataTerminal(scene, 0, -25, 'VAULT_MAINFRAME'));

    enemies.push(new CyberEnemy(scene, 'DRONE', -16, -5, 50));
    enemies.push(new CyberEnemy(scene, 'DRONE', 16, -5, 50));
    enemies.push(new CyberEnemy(scene, 'DRONE', 0, -10, 60));
  } else if (stageIdx === 1) {
    const pA = new PressurePlate(scene, 'ALPHA', -18, 5);
    plates.push(pA);
    laserGates.push(new LaserGate(scene, 0, -5, 16, [pA]));
    terminals.push(new DataTerminal(scene, 0, -22, 'DEFENSE_NEXUS'));

    enemies.push(new CyberEnemy(scene, 'TURRET', -8, -12, 100));
    enemies.push(new CyberEnemy(scene, 'TURRET', 8, -12, 100));
    enemies.push(new CyberEnemy(scene, 'DRONE', -14, 0, 60));
    enemies.push(new CyberEnemy(scene, 'DRONE', 14, 0, 60));
  } else {
    terminals.push(new DataTerminal(scene, 0, 0, 'OMEGA_CORE'));
    enemies.push(new CyberEnemy(scene, 'BOSS', 0, -12, 450));
    enemies.push(new CyberEnemy(scene, 'DRONE', -15, -8, 70));
    enemies.push(new CyberEnemy(scene, 'DRONE', 15, -8, 70));
  }
}

/* 6. Input Listeners */
const keys = { w: false, a: false, s: false, d: false, space: false, e: false };
const mousePos = { x: 0, y: 0, screenX: 0, screenY: 0 };
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mouseAimWorld = new THREE.Vector3();

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup')    keys.w = true;
  if (k === 'a' || k === 'arrowleft')  keys.a = true;
  if (k === 's' || k === 'arrowdown')  keys.s = true;
  if (k === 'd' || k === 'arrowright') keys.d = true;
  if (k === ' ') keys.space = true;
  if (k === 'e' || k === 'f') keys.e = true;
  if (k === 'r') triggerLoopRewind();
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup')    keys.w = false;
  if (k === 'a' || k === 'arrowleft')  keys.a = false;
  if (k === 's' || k === 'arrowdown')  keys.s = false;
  if (k === 'd' || k === 'arrowright') keys.d = false;
  if (k === ' ') keys.space = false;
  if (k === 'e' || k === 'f') keys.e = false;
});

window.addEventListener('mousemove', (e) => {
  mousePos.screenX = e.clientX;
  mousePos.screenY = e.clientY;
  mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
  mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(new THREE.Vector2(mousePos.x, mousePos.y), camera);
  raycaster.ray.intersectPlane(groundPlane, mouseAimWorld);
});

let isMouseDown = false;
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('#hudLayer') || e.target.closest('#screenModal')) return;
  isMouseDown = true;
});
window.addEventListener('mouseup', () => isMouseDown = false);

/* 7. Temporal Paradox Rewind Engine */
function triggerLoopRewind() {
  if (isRewinding) return;
  isRewinding = true;
  rewindTimer = 1.0;
  audio.playRewindSequence();
  document.body.classList.add('temporal-rewind-active');
  trauma = 0.85;
  hud.spawnDamagePopup(player.pos.x, player.pos.z, 'PARADOX OVERRIDE // REWINDING', '#ef4444');
}

function finalizeRewind() {
  isRewinding = false;
  document.body.classList.remove('temporal-rewind-active');

  chronoBuffer.commitRun(currentLoopIndex);
  currentLoopIndex = (currentLoopIndex + 1) % MAX_TIMELINES;
  loopTimer = 0.0;
  player.reset(0, 18);

  hud.setTimelineBadge(currentLoopIndex);
  plates.forEach(p => p.reset());
  laserGates.forEach(g => g.reset());
  projectilePool.clear();

  hud.spawnDamagePopup(player.pos.x, player.pos.z, `TIMELINE ${currentLoopIndex + 1} ONLINE`, '#38bdf8');
}

function onSectorCompleted() {
  isGameRunning = false;
  currentStageIndex++;

  const modal = document.getElementById('screenModal');
  const title = document.getElementById('modalTitle');
  const desc  = document.getElementById('modalDesc');
  const btn   = document.getElementById('btnModalAction');

  if (currentStageIndex >= GAME_STAGES.length) {
    title.innerText = 'OPERATION CONCLUDED // VICTORY';
    title.className = 'text-3xl sm:text-4xl font-black tracking-tight text-amber-400 mb-2 font-oxanium uppercase';
    desc.innerHTML = `All security perimeters breached with temporal precision! Coordinated heist verified.<br><br><strong>Technical Achievements:</strong> Deterministic State Recording, Sub-frame Replay Buffer, Zero-GC Object Pooling.`;
    btn.innerText = 'RESTART OPERATION';
    currentStageIndex = 0;
  } else {
    const next = GAME_STAGES[currentStageIndex];
    title.innerText = 'PERIMETER SECURED';
    title.className = 'text-3xl sm:text-4xl font-black tracking-tight text-sky-400 mb-2 font-oxanium uppercase';
    desc.innerHTML = `Telemetry acquired for <strong>${next.name}</strong>.<br><br>${next.objective}`;
    btn.innerText = `INITIALIZE SECTOR ${currentStageIndex + 1}`;
  }

  modal.style.display = 'flex';
}

function initStage(stageIdx) {
  const stage = GAME_STAGES[stageIdx];
  document.getElementById('txtSectorName').innerText = stage.name;
  document.getElementById('txtObjective').innerText = `OBJECTIVE: ${stage.objective}`;

  currentLoopIndex = 0;
  loopTimer = 0.0;
  chronoBuffer.clear();

  setupStage(stageIdx);

  player.reset(0, 18);
  ghostAlpha.reset(0, 18);
  ghostBeta.reset(0, 18);
  ghostAlpha.mesh.visible = false;
  ghostBeta.mesh.visible = false;

  hud.setTimelineBadge(0);
  isGameRunning = true;
}

/* 8. Main 60 FPS Fixed Game Loop */
let lastTime = performance.now();

function gameLoop(now) {
  requestAnimationFrame(gameLoop);

  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  // Screen shake
  if (trauma > 0) {
    trauma = Math.max(0, trauma - dt * 1.6);
    const shake = trauma * trauma * 1.3;
    camera.position.x = (Math.random() - 0.5) * shake;
    camera.position.y = 36 + (Math.random() - 0.5) * shake;
  } else {
    camera.position.x = 0;
    camera.position.y = 36;
  }

  if (!isGameRunning) {
    composer.render();
    return;
  }

  if (isRewinding) {
    rewindTimer -= dt;
    if (rewindTimer <= 0) finalizeRewind();
    composer.render();
    return;
  }

  // Loop Clock
  loopTimer += dt;
  hud.updateBars(player.hp, player.maxHp, player.dashCooldown, loopTimer, LOOP_DURATION);
  hud.updateChronoTracks(currentLoopIndex, loopTimer, LOOP_DURATION);

  if (loopTimer >= LOOP_DURATION) {
    triggerLoopRewind();
    composer.render();
    return;
  }

  // Player controls
  let moveX = 0, moveZ = 0;
  if (keys.w) moveZ -= 1;
  if (keys.s) moveZ += 1;
  if (keys.a) moveX -= 1;
  if (keys.d) moveX += 1;

  const moveLen = Math.hypot(moveX, moveZ);
  if (moveLen > 0.01) {
    moveX /= moveLen;
    moveZ /= moveLen;
  }

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  if (keys.space && player.dashCooldown <= 0 && !player.isDashing && moveLen > 0.1) {
    player.isDashing = true;
    player.dashDuration = 0.22;
    player.dashCooldown = 1.3;
    audio.playThrusterDash();
  }

  if (player.isDashing) {
    player.dashDuration -= dt;
    if (player.dashDuration <= 0) player.isDashing = false;
  }

  const curSpeed = player.isDashing ? player.speed * 2.8 : player.speed;
  const nextX = player.pos.x + moveX * curSpeed * dt;
  const nextZ = player.pos.z + moveZ * curSpeed * dt;

  let canMoveX = true, canMoveZ = true;
  for (const w of facility.walls) {
    if (nextX >= w.minX - 0.8 && nextX <= w.maxX + 0.8 && player.pos.z >= w.minZ - 0.8 && player.pos.z <= w.maxZ + 0.8) canMoveX = false;
    if (player.pos.x >= w.minX - 0.8 && player.pos.x <= w.maxX + 0.8 && nextZ >= w.minZ - 0.8 && nextZ <= w.maxZ + 0.8) canMoveZ = false;
  }
  for (const g of laserGates) {
    if (g.blocks(nextX, player.pos.z, 0.8)) canMoveX = false;
    if (g.blocks(player.pos.x, nextZ, 0.8)) canMoveZ = false;
  }
  if (canMoveX) player.pos.x = nextX;
  if (canMoveZ) player.pos.z = nextZ;

  const aimDx = mouseAimWorld.x - player.pos.x;
  const aimDz = mouseAimWorld.z - player.pos.z;
  player.rotationY = Math.atan2(aimDx, aimDz);
  player.mesh.rotation.y = player.rotationY;
  player.mesh.position.copy(player.pos);

  // Player Fire
  player.shootTimer -= dt;
  if (isMouseDown && player.shootTimer <= 0 && !player.isDashing) {
    player.shootTimer = 0.14;
    const muzzleX = player.pos.x + Math.sin(player.rotationY) * 1.3;
    const muzzleZ = player.pos.z + Math.cos(player.rotationY) * 1.3;
    projectilePool.spawn(muzzleX, muzzleZ, Math.sin(player.rotationY), Math.cos(player.rotationY), 40, false, false, 25);
    audio.playPlasmaShot();
  }

  chronoBuffer.recordFrame(loopTimer, player, isMouseDown, mouseAimWorld);

  // Ghost Playback
  const updateGhost = (ghost, runIdx) => {
    const frame = chronoBuffer.getPlaybackFrame(runIdx, loopTimer);
    if (!frame) {
      ghost.mesh.visible = false;
      return;
    }
    ghost.mesh.visible = true;
    ghost.pos.lerp(new THREE.Vector3(frame.x, 0, frame.z), 0.35);
    ghost.mesh.position.copy(ghost.pos);
    ghost.rotationY = frame.rotY;
    ghost.mesh.rotation.y = frame.rotY;
    ghost.isHacking = frame.isHacking;

    ghost.shootTimer = (ghost.shootTimer || 0) - dt;
    if (frame.isShooting && ghost.shootTimer <= 0) {
      ghost.shootTimer = 0.14;
      const muzzleX = ghost.pos.x + Math.sin(ghost.rotationY) * 1.2;
      const muzzleZ = ghost.pos.z + Math.cos(ghost.rotationY) * 1.2;
      projectilePool.spawn(muzzleX, muzzleZ, Math.sin(ghost.rotationY), Math.cos(ghost.rotationY), 38, false, true, 20);
      audio.playPlasmaShot();
    }
  };

  updateGhost(ghostAlpha, 0);
  updateGhost(ghostBeta, 1);

  const activeActors = [player];
  if (ghostAlpha.mesh.visible) activeActors.push(ghostAlpha);
  if (ghostBeta.mesh.visible)  activeActors.push(ghostBeta);

  // Update Interactables
  plates.forEach(p => p.update(activeActors, (x, z, id) => {
    audio.playHitMarker();
    hud.spawnDamagePopup(x, z, `RELAY [${id}] ENGAGED`, '#38bdf8');
  }));

  laserGates.forEach(g => g.update((x, z) => {
    audio.playHackSuccess();
    hud.spawnDamagePopup(x, z, 'PERIMETER SHIELD DE-ACTIVATED', '#38bdf8');
  }));

  terminals.forEach(t => t.update(activeActors, dt, (x, z) => {
    audio.playHackSuccess();
    hud.spawnDamagePopup(x, z, 'TERMINAL OVERRIDE COMPLETE', '#38bdf8');
    onSectorCompleted();
  }));

  // Bullets & Collisions
  projectilePool.update(dt, facility.walls, laserGates, () => {});

  for (const b of projectilePool.bullets) {
    if (!b.active) continue;
    if (b.isEnemy) {
      if (!player.isDead && b.pos.distanceTo(player.pos) < 1.4) {
        b.active = false;
        b.mesh.visible = false;
        player.takeDamage(b.damage, (x, z, d) => {
          hud.spawnDamagePopup(x, z, `-${d}`, '#ef4444');
          trauma = Math.min(1.0, trauma + 0.45);
          audio.playExplosion(false);
        }, (x, z) => {
          hud.spawnDamagePopup(x, z, 'CHASSIS COMPROMISED // REWINDING', '#ef4444');
          triggerLoopRewind();
        });
      }
      for (const g of [ghostAlpha, ghostBeta]) {
        if (g.mesh.visible && !g.isDead && b.pos.distanceTo(g.pos) < 1.4) {
          b.active = false;
          b.mesh.visible = false;
          hud.spawnDamagePopup(g.pos.x, g.pos.z, 'DECOY INTERCEPT', '#38bdf8');
        }
      }
    } else {
      for (const enemy of enemies) {
        if (!enemy.isDead && b.pos.distanceTo(enemy.pos) < 2.2) {
          b.active = false;
          b.mesh.visible = false;
          enemy.takeDamage(b.damage, (x, z, d, ratio) => {
            hud.spawnDamagePopup(x, z, `+${d}`, '#f59e0b');
            hud.showHitMarker(mousePos.screenX, mousePos.screenY);
            audio.playHitMarker();
            if (enemy.type === 'BOSS') {
              const bar = document.getElementById('barBossHealth');
              if (bar) bar.style.width = `${ratio * 100}%`;
            }
          }, (x, z, isBoss) => {
            audio.playExplosion(isBoss);
            hud.spawnDamagePopup(x, z, 'SENTINEL DESTROYED', '#38bdf8');
            if (isBoss) onSectorCompleted();
          });
          break;
        }
      }
    }
  }

  // Update Enemies
  enemies.forEach(e => e.update(activeActors, dt, (mx, mz, dirX, dirZ) => {
    projectilePool.spawn(mx, mz, dirX, dirZ, 26, true, false, 15);
  }));

  composer.render();
}

/* 9. Event Listeners */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('btnAudioToggle')?.addEventListener('click', () => {
  const active = audio.toggle();
  const el = document.getElementById('txtAudioState');
  if (el) el.innerText = active ? 'SYNTH_ON' : 'MUTED';
});

document.getElementById('btnRewindAction')?.addEventListener('click', () => {
  triggerLoopRewind();
});

document.getElementById('btnModalAction')?.addEventListener('click', () => {
  audio.init();
  document.getElementById('screenModal').style.display = 'none';
  initStage(currentStageIndex);
});

requestAnimationFrame(gameLoop);
