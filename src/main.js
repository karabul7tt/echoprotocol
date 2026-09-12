// Echo Protocol - Main Game Loop
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { SoundManager } from './audio.js';
import { BulletPool }   from './bullets.js';
import { Player }       from './player.js';
import { GhostSystem }  from './ghost.js';
import { Enemy }        from './enemy.js';
import { GameMap }      from './map.js';
import { UI }           from './ui.js';

const LOOP_TIME = 12.0;
const MAX_LOOPS = 3;

const STAGES = [
  { name: 'SEC 1: VAULT ENTRANCE', desc: 'Hold switch A & B with past clones to drop the laser barrier, then hack the core terminal!' },
  { name: 'SEC 2: TURRET LINE', desc: 'Use your past ghost as a decoy to draw turret fire while you flank the side!' },
  { name: 'SEC 3: OMEGA BOSS', desc: 'Combine firepower with both ghost clones to destroy the Omega mech!' }
];

let stageIndex = 0;
let loopIndex = 0;
let loopTimer = 0.0;
let isRewinding = false;
let rewindTimer = 0.0;
let isRunning = false;
let screenShake = 0.0;

// Setup Three.js
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
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
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.75, 0.3, 0.88);
composer.addPass(bloom);

// Lights
scene.add(new THREE.AmbientLight('#1b2230', 1.2));
const sun = new THREE.DirectionalLight('#f8fafc', 2.2);
sun.position.set(24, 45, 18);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.bias = -0.0005;
scene.add(sun);

const spot = new THREE.SpotLight('#fbbf24', 2.0, 50, Math.PI / 4, 0.5, 1.2);
spot.position.set(0, 22, -5);
spot.target.position.set(0, 0, -5);
scene.add(spot);
scene.add(spot.target);

// Modules
const audio = new SoundManager();
const ghosts = new GhostSystem();
const bullets = new BulletPool(scene, 160);
const map = new GameMap(scene);
const ui = new UI(camera);

// Player and Clones
const player = new Player(scene, false);
const ghost1 = new Player(scene, true, '#f59e0b');
const ghost2 = new Player(scene, true, '#38bdf8');
ghost1.mesh.visible = false;
ghost2.mesh.visible = false;

let enemies = [];

function loadStage(idx) {
  map.setupLevel(idx);
  enemies.forEach(e => scene.remove(e.mesh));
  enemies = [];

  if (idx === 0) {
    enemies.push(new Enemy(scene, 'drone', -16, -5, 50));
    enemies.push(new Enemy(scene, 'drone', 16, -5, 50));
    enemies.push(new Enemy(scene, 'drone', 0, -10, 60));
  } else if (idx === 1) {
    enemies.push(new Enemy(scene, 'turret', -8, -12, 100));
    enemies.push(new Enemy(scene, 'turret', 8, -12, 100));
    enemies.push(new Enemy(scene, 'drone', -14, 0, 60));
    enemies.push(new Enemy(scene, 'drone', 14, 0, 60));
  } else {
    enemies.push(new Enemy(scene, 'boss', 0, -12, 450));
    enemies.push(new Enemy(scene, 'drone', -15, -8, 70));
    enemies.push(new Enemy(scene, 'drone', 15, -8, 70));
  }

  const s = STAGES[idx];
  document.getElementById('txtSectorName').innerText = s.name;
  document.getElementById('txtObjective').innerText = s.desc;

  loopIndex = 0;
  loopTimer = 0.0;
  ghosts.reset();

  player.reset(0, 18);
  ghost1.reset(0, 18);
  ghost2.reset(0, 18);
  ghost1.mesh.visible = false;
  ghost2.mesh.visible = false;

  ui.setLoopBadge(0);
  isRunning = true;
}

// Controls
const keys = { w: false, a: false, s: false, d: false, space: false, e: false };
const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
const raycaster = new THREE.Raycaster();
const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const aimPos = new THREE.Vector3();

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.w = true;
  if (k === 'a' || k === 'arrowleft') keys.a = true;
  if (k === 's' || k === 'arrowdown') keys.s = true;
  if (k === 'd' || k === 'arrowright') keys.d = true;
  if (k === ' ') keys.space = true;
  if (k === 'e' || k === 'f') keys.e = true;
  if (k === 'r') triggerRewind();
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.w = false;
  if (k === 'a' || k === 'arrowleft') keys.a = false;
  if (k === 's' || k === 'arrowdown') keys.s = false;
  if (k === 'd' || k === 'arrowright') keys.d = false;
  if (k === ' ') keys.space = false;
  if (k === 'e' || k === 'f') keys.e = false;
});

window.addEventListener('mousemove', (e) => {
  mouse.sx = e.clientX;
  mouse.sy = e.clientY;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
  raycaster.ray.intersectPlane(ground, aimPos);
});

let isMouseDown = false;
window.addEventListener('mousedown', (e) => {
  if (e.target.closest('#hudLayer') || e.target.closest('#screenModal')) return;
  isMouseDown = true;
});
window.addEventListener('mouseup', () => isMouseDown = false);

// Rewind loop
function triggerRewind() {
  if (isRewinding) return;
  isRewinding = true;
  rewindTimer = 1.0;
  audio.playRewind();
  document.body.classList.add('temporal-rewind-active');
  screenShake = 0.85;
  ui.showDamage(player.pos.x, player.pos.z, 'REWINDING TIME', '#ef4444');
}

function completeRewind() {
  isRewinding = false;
  document.body.classList.remove('temporal-rewind-active');

  ghosts.saveRun(loopIndex);
  loopIndex = (loopIndex + 1) % MAX_LOOPS;
  loopTimer = 0.0;
  player.reset(0, 18);

  ui.setLoopBadge(loopIndex);
  map.plates.forEach(p => p.reset());
  map.gates.forEach(g => g.reset());
  bullets.clear();

  ui.showDamage(player.pos.x, player.pos.z, `LOOP ${loopIndex + 1} START`, '#38bdf8');
}

function nextStage() {
  isRunning = false;
  stageIndex++;

  const modal = document.getElementById('screenModal');
  const title = document.getElementById('modalTitle');
  const desc = document.getElementById('modalDesc');
  const btn = document.getElementById('btnModalAction');

  if (stageIndex >= STAGES.length) {
    title.innerText = 'MISSION COMPLETE!';
    title.className = 'text-3xl sm:text-4xl font-black text-amber-400 mb-2 font-oxanium uppercase';
    desc.innerText = 'You cleared all sectors using your past clones!';
    btn.innerText = 'PLAY AGAIN';
    stageIndex = 0;
  } else {
    const s = STAGES[stageIndex];
    title.innerText = 'SECTOR CLEARED';
    title.className = 'text-3xl sm:text-4xl font-black text-sky-400 mb-2 font-oxanium uppercase';
    desc.innerText = `${s.name}: ${s.desc}`;
    btn.innerText = `START SECTOR ${stageIndex + 1}`;
  }

  modal.style.display = 'flex';
}

// Game loop (60 fps)
let lastTime = performance.now();

function update(now) {
  requestAnimationFrame(update);

  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  // Screen shake
  if (screenShake > 0) {
    screenShake = Math.max(0, screenShake - dt * 1.6);
    const shake = screenShake * screenShake * 1.3;
    camera.position.x = (Math.random() - 0.5) * shake;
    camera.position.y = 36 + (Math.random() - 0.5) * shake;
  } else {
    camera.position.x = 0;
    camera.position.y = 36;
  }

  if (!isRunning) {
    composer.render();
    return;
  }

  if (isRewinding) {
    rewindTimer -= dt;
    if (rewindTimer <= 0) completeRewind();
    composer.render();
    return;
  }

  loopTimer += dt;
  ui.updateHUD(player.hp, player.maxHp, player.dashCooldown, loopTimer, LOOP_TIME);
  ui.updateTimelineTracks(loopIndex, loopTimer, LOOP_TIME);

  if (loopTimer >= LOOP_TIME) {
    triggerRewind();
    composer.render();
    return;
  }

  // Move player
  let mx = 0, mz = 0;
  if (keys.w) mz -= 1;
  if (keys.s) mz += 1;
  if (keys.a) mx -= 1;
  if (keys.d) mx += 1;

  const len = Math.hypot(mx, mz);
  if (len > 0.01) {
    mx /= len;
    mz /= len;
  }

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  if (keys.space && player.dashCooldown <= 0 && !player.isDashing && len > 0.1) {
    player.isDashing = true;
    player.dashDuration = 0.22;
    player.dashCooldown = 1.3;
    audio.playDash();
  }

  if (player.isDashing) {
    player.dashDuration -= dt;
    if (player.dashDuration <= 0) player.isDashing = false;
  }

  const speed = player.isDashing ? player.speed * 2.8 : player.speed;
  const nx = player.pos.x + mx * speed * dt;
  const nz = player.pos.z + mz * speed * dt;

  let canX = true, canZ = true;
  for (const w of map.walls) {
    if (nx >= w.minX - 0.8 && nx <= w.maxX + 0.8 && player.pos.z >= w.minZ - 0.8 && player.pos.z <= w.maxZ + 0.8) canX = false;
    if (player.pos.x >= w.minX - 0.8 && player.pos.x <= w.maxX + 0.8 && nz >= w.minZ - 0.8 && nz <= w.maxZ + 0.8) canZ = false;
  }
  for (const g of map.gates) {
    if (g.blocks(nx, player.pos.z, 0.8)) canX = false;
    if (g.blocks(player.pos.x, nz, 0.8)) canZ = false;
  }
  if (canX) player.pos.x = nx;
  if (canZ) player.pos.z = nz;

  // Aim towards mouse
  const dx = aimPos.x - player.pos.x;
  const dz = aimPos.z - player.pos.z;
  player.rotationY = Math.atan2(dx, dz);
  player.mesh.rotation.y = player.rotationY;
  player.mesh.position.copy(player.pos);

  // Shoot
  player.shootTimer -= dt;
  if (isMouseDown && player.shootTimer <= 0 && !player.isDashing) {
    player.shootTimer = 0.14;
    const sx = player.pos.x + Math.sin(player.rotationY) * 1.3;
    const sz = player.pos.z + Math.cos(player.rotationY) * 1.3;
    bullets.spawn(sx, sz, Math.sin(player.rotationY), Math.cos(player.rotationY), 40, false, false, 25);
    audio.playShoot();
  }

  ghosts.record(loopTimer, player, isMouseDown, aimPos);

  // Update ghost replays
  const updateClone = (ghost, runIdx) => {
    const f = ghosts.getFrame(runIdx, loopTimer);
    if (!f) {
      ghost.mesh.visible = false;
      return;
    }
    ghost.mesh.visible = true;
    ghost.pos.lerp(new THREE.Vector3(f.x, 0, f.z), 0.35);
    ghost.mesh.position.copy(ghost.pos);
    ghost.rotationY = f.rotY;
    ghost.mesh.rotation.y = f.rotY;
    ghost.isHacking = f.isHacking;

    ghost.shootTimer = (ghost.shootTimer || 0) - dt;
    if (f.isShooting && ghost.shootTimer <= 0) {
      ghost.shootTimer = 0.14;
      const sx = ghost.pos.x + Math.sin(ghost.rotationY) * 1.2;
      const sz = ghost.pos.z + Math.cos(ghost.rotationY) * 1.2;
      bullets.spawn(sx, sz, Math.sin(ghost.rotationY), Math.cos(ghost.rotationY), 38, false, true, 20);
      audio.playShoot();
    }
  };

  updateClone(ghost1, 0);
  updateClone(ghost2, 1);

  const actors = [player];
  if (ghost1.mesh.visible) actors.push(ghost1);
  if (ghost2.mesh.visible) actors.push(ghost2);

  // Map updates
  map.plates.forEach(p => p.update(actors, (x, z, label) => {
    audio.playHit();
    ui.showDamage(x, z, `PLATE ${label} PRESSED`, '#38bdf8');
  }));

  map.gates.forEach(g => g.update((x, z) => {
    audio.playSuccess();
    ui.showDamage(x, z, 'GATE OPENED', '#38bdf8');
  }));

  map.terminals.forEach(t => t.update(actors, dt, (x, z) => {
    audio.playSuccess();
    ui.showDamage(x, z, 'HACK COMPLETE', '#38bdf8');
    nextStage();
  }));

  // Bullets update
  bullets.update(dt, map.walls, map.gates, () => {});

  for (const b of bullets.bullets) {
    if (!b.active) continue;
    if (b.isEnemy) {
      if (!player.isDead && b.pos.distanceTo(player.pos) < 1.4) {
        b.active = false;
        b.mesh.visible = false;
        player.takeDamage(b.damage, (x, z, dmg) => {
          ui.showDamage(x, z, `-${dmg}`, '#ef4444');
          screenShake = Math.min(1.0, screenShake + 0.45);
          audio.playExplosion(false);
        }, (x, z) => {
          ui.showDamage(x, z, 'DEFEATED - REWINDING', '#ef4444');
          triggerRewind();
        });
      }
      for (const g of [ghost1, ghost2]) {
        if (g.mesh.visible && !g.isDead && b.pos.distanceTo(g.pos) < 1.4) {
          b.active = false;
          b.mesh.visible = false;
          ui.showDamage(g.pos.x, g.pos.z, 'CLONE BLOCKED', '#38bdf8');
        }
      }
    } else {
      for (const e of enemies) {
        if (!e.isDead && b.pos.distanceTo(e.pos) < 2.2) {
          b.active = false;
          b.mesh.visible = false;
          e.takeDamage(b.damage, (x, z, dmg, ratio) => {
            ui.showDamage(x, z, `+${dmg}`, '#f59e0b');
            ui.showHit(mouse.sx, mouse.sy);
            audio.playHit();
            if (e.type === 'boss') {
              const bar = document.getElementById('barBossHealth');
              if (bar) bar.style.width = `${ratio * 100}%`;
            }
          }, (x, z, isBoss) => {
            audio.playExplosion(isBoss);
            ui.showDamage(x, z, 'DESTROYED', '#38bdf8');
            if (isBoss) nextStage();
          });
          break;
        }
      }
    }
  }

  // Enemies update
  enemies.forEach(e => e.update(actors, dt, (mx, mz, dirX, dirZ) => {
    bullets.spawn(mx, mz, dirX, dirZ, 26, true, false, 15);
  }));

  composer.render();
}

// Window events
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('btnAudioToggle')?.addEventListener('click', () => {
  const on = audio.toggle();
  const el = document.getElementById('txtAudioState');
  if (el) el.innerText = on ? 'AUDIO ON' : 'MUTED';
});

document.getElementById('btnRewindAction')?.addEventListener('click', triggerRewind);

document.getElementById('btnModalAction')?.addEventListener('click', () => {
  audio.init();
  document.getElementById('screenModal').style.display = 'none';
  loadStage(stageIndex);
});

requestAnimationFrame(update);
