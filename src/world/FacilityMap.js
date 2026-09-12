/**
 * ECHO PROTOCOL // PROCEDURAL FACILITY MAP & SHADOW GENERATOR
 * Engineered by Mehmet Karabulut
 */
import * as THREE from 'three';

export class FacilityMap {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.initFloor();
    this.buildArchitecture();
  }

  initFloor() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext('2d');

    // Base metal plate
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(0, 0, 1024, 1024);

    // Seams
    ctx.strokeStyle = '#1b212f';
    ctx.lineWidth = 4;
    for (let i = 0; i <= 1024; i += 256) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Rivets
    ctx.fillStyle = '#2c364c';
    for (let x = 0; x < 1024; x += 256) {
      for (let y = 0; y < 1024; y += 256) {
        const offsets = [[12, 12], [244, 12], [12, 244], [244, 244]];
        for (const [ox, oy] of offsets) {
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Central Vent Grate
    ctx.fillStyle = '#06070a';
    ctx.fillRect(384, 384, 256, 256);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(384, 384, 256, 256);

    ctx.strokeStyle = '#1f293d';
    ctx.lineWidth = 4;
    for (let gy = 396; gy < 640; gy += 16) {
      ctx.beginPath();
      ctx.moveTo(390, gy); ctx.lineTo(634, gy);
      ctx.stroke();
    }

    // Military Stencils
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#d97706';
    ctx.fillText('SECTOR // INFILTRATION GRID', 40, 60);
    ctx.fillText('KEEP CLEAR // HIGH VOLTAGE', 40, 80);
    ctx.fillText('RESTRICTED ACCESS 01-A', 740, 60);
    ctx.fillText('AUTOMATED DEFENSE ONLINE', 740, 80);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);

    const floorMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.65,
      metalness: 0.85
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);
  }

  buildArchitecture() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#161c28',
      roughness: 0.35,
      metalness: 0.9,
      emissive: '#080b12'
    });
    const amberTrimMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });

    const createWall = (x, z, w, d, h = 4.2) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      box.position.set(x, h / 2, z);
      box.castShadow = true;
      box.receiveShadow = true;
      this.group.add(box);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.15, d + 0.04), amberTrimMat);
      trim.position.set(x, h - 0.1, z);
      this.group.add(trim);

      this.walls.push({ x, z, w, d, minX: x - w/2, maxX: x + w/2, minZ: z - d/2, maxZ: z + d/2 });
    };

    // Perimeter
    createWall(0, -32, 64, 2);
    createWall(0, 32, 64, 2);
    createWall(-32, 0, 2, 64);
    createWall(32, 0, 2, 64);

    // Blast pylons
    createWall(-12, -10, 3.8, 10);
    createWall(12, -10, 3.8, 10);
    createWall(-12, 12, 3.8, 7);
    createWall(12, 12, 3.8, 7);

    // Crates
    const createCrate = (cx, cz, rotY = 0) => {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.2, 2.4),
        new THREE.MeshStandardMaterial({ color: '#242d3d', metalness: 0.8, roughness: 0.4 })
      );
      crate.position.set(cx, 1.1, cz);
      crate.rotation.y = rotY;
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.group.add(crate);

      const band = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.4, 2.42), amberTrimMat);
      band.position.set(cx, 1.1, cz);
      band.rotation.y = rotY;
      this.group.add(band);

      this.walls.push({ x: cx, z: cz, w: 2.4, d: 2.4, minX: cx - 1.2, maxX: cx + 1.2, minZ: cz - 1.2, maxZ: cz + 1.2 });
    };

    createCrate(-5, -6, 0.2);
    createCrate(5, -6, -0.15);
    createCrate(-20, 8, 0.4);
    createCrate(20, 8, -0.3);
  }
}
