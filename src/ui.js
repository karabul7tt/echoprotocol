// User interface, health bars, damage popups, and hit marker
import * as THREE from 'three';

export class UI {
  constructor(camera) {
    this.camera = camera;
    this.hitMarker = document.getElementById('hitMarker');
    this.container = document.getElementById('floatingTextContainer');
  }

  showHit(screenX, screenY) {
    if (!this.hitMarker) return;
    this.hitMarker.style.left = `${screenX}px`;
    this.hitMarker.style.top = `${screenY}px`;
    this.hitMarker.style.opacity = '1';
    setTimeout(() => {
      this.hitMarker.style.opacity = '0';
    }, 75);
  }

  showDamage(worldX, worldZ, text, color = '#fbbf24') {
    if (!this.container) return;
    const p = new THREE.Vector3(worldX, 2.5, worldZ).project(this.camera);
    const sx = (p.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-(p.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'damage-popup text-xs uppercase';
    el.style.left = `${sx}px`;
    el.style.top = `${sy}px`;
    el.style.color = color;
    el.innerText = text;
    this.container.appendChild(el);

    setTimeout(() => el.remove(), 650);
  }

  updateHUD(hp, maxHp, dashCooldown, timer, maxTimer) {
    const hpText = document.getElementById('txtPlayerHP');
    const hpBar = document.getElementById('barPlayerHP');
    if (hpText) hpText.innerText = `${Math.ceil(hp)} / ${maxHp}`;
    if (hpBar) hpBar.style.width = `${(hp / maxHp) * 100}%`;

    const dashRatio = 1.0 - Math.min(1.0, dashCooldown / 1.3);
    const dashBar = document.getElementById('barDashCooldown');
    const dashText = document.getElementById('txtDashCooldown');
    if (dashBar) dashBar.style.width = `${dashRatio * 100}%`;
    if (dashText) dashText.innerText = dashRatio >= 1.0 ? 'READY' : 'CHARGING';

    const timeLeft = Math.max(0, maxTimer - timer);
    const timerText = document.getElementById('txtLoopTimer');
    if (timerText) timerText.innerText = `${timeLeft.toFixed(2)}s`;
  }

  updateTimelineTracks(loopIdx, timer, maxTimer) {
    const ratio = (timer / maxTimer) * 100;
    const a = document.getElementById('barTrackAlpha');
    const b = document.getElementById('barTrackBeta');
    const g = document.getElementById('barTrackGamma');

    if (loopIdx === 0 && a) a.style.width = `${ratio}%`;
    if (loopIdx === 1 && b) b.style.width = `${ratio}%`;
    if (loopIdx === 2 && g) g.style.width = `${ratio}%`;
  }

  setLoopBadge(loopIdx) {
    const badge = document.getElementById('badgeLoopState');
    if (!badge) return;
    if (loopIdx === 1) {
      badge.innerText = 'LOOP 2 // BETA';
      badge.className = 'text-[10px] uppercase font-chakra font-bold px-2 py-0.5 bg-sky-950/70 border border-sky-500/40 text-sky-300 tracking-wider cut-corner-sm';
    } else if (loopIdx === 2) {
      badge.innerText = 'LOOP 3 // GAMMA';
      badge.className = 'text-[10px] uppercase font-chakra font-bold px-2 py-0.5 bg-slate-900 border border-slate-500 text-slate-200 tracking-wider cut-corner-sm';
    } else {
      badge.innerText = 'LOOP 1 // ALPHA';
      badge.className = 'text-[10px] uppercase font-chakra font-bold px-2 py-0.5 bg-amber-950/70 border border-amber-500/40 text-amber-400 tracking-wider cut-corner-sm';
    }
  }
}
