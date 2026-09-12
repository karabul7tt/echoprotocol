/**
 * ECHO PROTOCOL // TACTICAL HUD & HIT-MARKER CONTROLLER
 * Engineered by Mehmet Karabulut
 */
export class TacticalHUD {
  constructor(camera) {
    this.camera = camera;
    this.hitMarkerEl = document.getElementById('hitMarker');
    this.textContainer = document.getElementById('floatingTextContainer');
  }

  showHitMarker(screenX, screenY) {
    if (!this.hitMarkerEl) return;
    this.hitMarkerEl.style.left = `${screenX}px`;
    this.hitMarkerEl.style.top = `${screenY}px`;
    this.hitMarkerEl.style.opacity = '1';
    setTimeout(() => {
      this.hitMarkerEl.style.opacity = '0';
    }, 75);
  }

  spawnDamagePopup(worldX, worldZ, text, color = '#fbbf24') {
    if (!this.textContainer) return;
    const v = { x: worldX, y: 2.5, z: worldZ };
    // Project 3D coordinate to 2D screen
    const p = new THREE.Vector3(v.x, v.y, v.z).project(this.camera);
    const screenX = (p.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(p.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'damage-popup text-xs tracking-wider uppercase';
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;
    el.style.color = color;
    el.innerText = text;
    this.textContainer.appendChild(el);

    setTimeout(() => el.remove(), 650);
  }

  updateBars(playerHp, maxHp, dashCooldown, loopTimer, loopDuration) {
    const hpEl = document.getElementById('txtPlayerHP');
    const barHpEl = document.getElementById('barPlayerHP');
    if (hpEl) hpEl.innerText = `${Math.ceil(playerHp)} / ${maxHp}`;
    if (barHpEl) barHpEl.style.width = `${(playerHp / maxHp) * 100}%`;

    const dashRatio = 1.0 - Math.min(1.0, dashCooldown / 1.3);
    const dashBarEl = document.getElementById('barDashCooldown');
    const dashTxtEl = document.getElementById('txtDashCooldown');
    if (dashBarEl) dashBarEl.style.width = `${dashRatio * 100}%`;
    if (dashTxtEl) dashTxtEl.innerText = dashRatio >= 1.0 ? 'READY' : 'CHARGING';

    const timeLeft = Math.max(0, loopDuration - loopTimer);
    const loopTimerEl = document.getElementById('txtLoopTimer');
    if (loopTimerEl) loopTimerEl.innerText = `${timeLeft.toFixed(2)}s`;
  }

  updateChronoTracks(loopIndex, loopTimer, loopDuration) {
    const ratio = loopTimer / loopDuration;
    const trackAlpha = document.getElementById('barTrackAlpha');
    const trackBeta = document.getElementById('barTrackBeta');
    const trackGamma = document.getElementById('barTrackGamma');

    if (loopIndex === 0 && trackAlpha) trackAlpha.style.width = `${ratio * 100}%`;
    if (loopIndex === 1 && trackBeta)  trackBeta.style.width = `${ratio * 100}%`;
    if (loopIndex === 2 && trackGamma) trackGamma.style.width = `${ratio * 100}%`;
  }

  setTimelineBadge(loopIndex) {
    const badge = document.getElementById('badgeLoopState');
    if (!badge) return;
    if (loopIndex === 1) {
      badge.innerText = 'TIMELINE 02 // BETA ACTIVE';
      badge.className = 'text-[10px] uppercase font-chakra font-bold px-2 py-0.5 bg-sky-950/70 border border-sky-500/40 text-sky-300 tracking-wider cut-corner-sm';
    } else if (loopIndex === 2) {
      badge.innerText = 'TIMELINE 03 // GAMMA BREACH';
      badge.className = 'text-[10px] uppercase font-chakra font-bold px-2 py-0.5 bg-slate-900 border border-slate-500 text-slate-200 tracking-wider cut-corner-sm';
    } else {
      badge.innerText = 'TIMELINE 01 // ALPHA RECORDING';
      badge.className = 'text-[10px] uppercase font-chakra font-bold px-2 py-0.5 bg-amber-950/70 border border-amber-500/40 text-amber-400 tracking-wider cut-corner-sm';
    }
  }
}
import * as THREE from 'three';
