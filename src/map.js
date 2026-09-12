// Level map, walls, pressure plates, laser gates, and terminal objects
import * as THREE from 'three';

export class GameMap {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.plates = [];
    this.gates = [];
    this.terminals = [];

    this.initFloor();
    this.buildWalls();
  }

  initFloor() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Dark steel floor
    ctx.fillStyle = '#0c0e14';
    ctx.fillRect(0, 0, 1024, 1024);

    // Grid panels
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

    // Corner bolts
    ctx.fillStyle = '#2c364c';
    for (let x = 0; x < 1024; x += 256) {
      for (let y = 0; y < 1024; y += 256) {
        for (const [ox, oy] of [[12, 12], [244, 12], [12, 244], [244, 244]]) {
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Center grate
    ctx.fillStyle = '#06070a';
    ctx.fillRect(384, 384, 256, 256);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(384, 384, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);

    const floorMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65, metalness: 0.85 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  buildWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: '#161c28', roughness: 0.35, metalness: 0.9 });
    const trimMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });

    const addWall = (x, z, w, d, h = 4.2) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      box.position.set(x, h / 2, z);
      box.castShadow = true;
      box.receiveShadow = true;
      this.scene.add(box);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.15, d + 0.04), trimMat);
      trim.position.set(x, h - 0.1, z);
      this.scene.add(trim);

      this.walls.push({ x, z, w, d, minX: x - w/2, maxX: x + w/2, minZ: z - d/2, maxZ: z + d/2 });
    };

    // Outer perimeter
    addWall(0, -32, 64, 2);
    addWall(0, 32, 64, 2);
    addWall(-32, 0, 2, 64);
    addWall(32, 0, 2, 64);

    // Pillars
    addWall(-12, -10, 3.8, 10);
    addWall(12, -10, 3.8, 10);
    addWall(-12, 12, 3.8, 7);
    addWall(12, 12, 3.8, 7);

    // Cover crates
    const addCrate = (cx, cz) => {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.2, 2.4),
        new THREE.MeshStandardMaterial({ color: '#242d3d', metalness: 0.8, roughness: 0.4 })
      );
      crate.position.set(cx, 1.1, cz);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);

      this.walls.push({ x: cx, z: cz, w: 2.4, d: 2.4, minX: cx - 1.2, maxX: cx + 1.2, minZ: cz - 1.2, maxZ: cz + 1.2 });
    };

    addCrate(-5, -6);
    addCrate(5, -6);
    addCrate(-20, 8);
    addCrate(20, 8);
  }

  setupLevel(stageIndex) {
    this.plates.forEach(p => this.scene.remove(p.mesh));
    this.gates.forEach(g => this.scene.remove(g.mesh));
    this.terminals.forEach(t => this.scene.remove(t.mesh));
    this.plates = [];
    this.gates = [];
    this.terminals = [];

    if (stageIndex === 0) {
      const pA = new Plate(this.scene, 'A', -16, -14);
      const pB = new Plate(this.scene, 'B', 16, -14);
      this.plates.push(pA, pB);
      this.gates.push(new Gate(this.scene, 0, -18, 14, [pA, pB]));
      this.terminals.push(new Terminal(this.scene, 0, -25, 'VAULT_CORE'));
    } else if (stageIndex === 1) {
      const pA = new Plate(this.scene, 'A', -18, 5);
      this.plates.push(pA);
      this.gates.push(new Gate(this.scene, 0, -5, 16, [pA]));
      this.terminals.push(new Terminal(this.scene, 0, -22, 'NEXUS'));
    } else {
      this.terminals.push(new Terminal(this.scene, 0, 0, 'CORE'));
    }
  }
}

export class Plate {
  constructor(scene, label, x, z) {
    this.scene = scene;
    this.label = label;
    this.pos = new THREE.Vector3(x, 0.05, z);
    this.radius = 2.4;
    this.isPressed = false;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: '#1a2130', metalness: 0.9 })
    );
    this.mesh.add(base);

    const ringGeo = new THREE.RingGeometry(1.2, 1.9, 16);
    ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, this.ringMat);
    ring.position.y = 0.13;
    this.mesh.add(ring);

    this.scene.add(this.mesh);
  }

  update(actors, onHit) {
    let pressed = false;
    for (const a of actors) {
      if (!a || a.isDead) continue;
      const d = new THREE.Vector2(a.mesh.position.x - this.pos.x, a.mesh.position.z - this.pos.z).length();
      if (d < this.radius) {
        pressed = true;
        break;
      }
    }

    if (pressed !== this.isPressed) {
      this.isPressed = pressed;
      if (this.isPressed) {
        this.ringMat.color.set('#38bdf8');
        this.mesh.position.y = -0.06;
        onHit(this.pos.x, this.pos.z, this.label);
      } else {
        this.ringMat.color.set('#f59e0b');
        this.mesh.position.y = 0.05;
      }
    }
  }

  reset() {
    this.isPressed = false;
    this.ringMat.color.set('#f59e0b');
    this.mesh.position.y = 0.05;
  }
}

export class Gate {
  constructor(scene, x, z, width, plates = []) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.width = width;
    this.plates = plates;
    this.isOpen = false;

    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);

    const pMat = new THREE.MeshStandardMaterial({ color: '#161b24', metalness: 0.9 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.8, 1.4), pMat);
    p1.position.set(-width / 2, 2.4, 0);
    const p2 = p1.clone();
    p2.position.set(width / 2, 2.4, 0);
    this.mesh.add(p1, p2);

    this.laser = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 3.8),
      new THREE.MeshBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    this.laser.position.set(0, 2.4, 0);
    this.mesh.add(this.laser);

    this.scene.add(this.mesh);
  }

  update(onOpen) {
    const all = this.plates.length > 0 && this.plates.every(p => p.isPressed);
    if (all && !this.isOpen) {
      this.isOpen = true;
      this.laser.visible = false;
      onOpen(this.x, this.z);
    } else if (!all && this.isOpen) {
      this.isOpen = false;
      this.laser.visible = true;
    }
  }

  blocks(ax, az, r = 0.8) {
    if (this.isOpen) return false;
    return ax >= this.x - this.width/2 - r && ax <= this.x + this.width/2 + r && az >= this.z - 1.2 && az <= this.z + 1.2;
  }

  reset() {
    this.isOpen = false;
    this.laser.visible = true;
  }
}

export class Terminal {
  constructor(scene, x, z, label) {
    this.scene = scene;
    this.pos = new THREE.Vector3(x, 0, z);
    this.label = label;
    this.progress = 0;
    this.isDone = false;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.4, 2.6),
      new THREE.MeshStandardMaterial({ color: '#11141c', metalness: 0.9 })
    );
    base.position.y = 1.2;
    this.mesh.add(base);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.06, 6, 24),
      new THREE.MeshBasicMaterial({ color: '#f59e0b', wireframe: true })
    );
    this.ring.position.y = 3.0;
    this.mesh.add(this.ring);

    this.scene.add(this.mesh);
  }

  update(actors, dt, onComplete) {
    this.ring.rotation.y += 1.2 * dt;
    if (this.isDone) return;

    let hacking = false;
    for (const a of actors) {
      if (!a || a.isDead) continue;
      const d = new THREE.Vector2(a.mesh.position.x - this.pos.x, a.mesh.position.z - this.pos.z).length();
      if (d < 3.2 && a.isHacking) {
        hacking = true;
        break;
      }
    }

    if (hacking) {
      this.progress = Math.min(1.0, this.progress + dt * 0.45);
      this.ring.material.color.set('#38bdf8');
      if (this.progress >= 1.0) {
        this.isDone = true;
        onComplete(this.pos.x, this.pos.z);
      }
    } else {
      this.ring.material.color.set(this.isDone ? '#38bdf8' : '#f59e0b');
    }
  }

  reset() {
    this.progress = 0;
    this.isDone = false;
    this.ring.material.color.set('#f59e0b');
  }
}
