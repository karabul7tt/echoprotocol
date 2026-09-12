/**
 * ECHO PROTOCOL // SECURITY INTERACTABLES (PRESSURE RELAYS, LASER GATES, TERMINALS)
 * Engineered by Mehmet Karabulut
 */
import * as THREE from 'three';

export class PressurePlate {
  constructor(scene, id, x, z) {
    this.scene = scene;
    this.id = id;
    this.pos = new THREE.Vector3(x, 0.05, z);
    this.radius = 2.4;
    this.isPressed = false;

    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.5, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: '#1a2130', metalness: 0.9, roughness: 0.3 })
    );
    base.receiveShadow = true;
    this.group.add(base);

    const ringGeo = new THREE.RingGeometry(1.2, 1.9, 16);
    ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, this.ringMat);
    ring.position.y = 0.13;
    this.group.add(ring);

    this.scene.add(this.group);
  }

  update(actors, onEngage) {
    let pressedNow = false;
    for (const actor of actors) {
      if (!actor || actor.isDead) continue;
      const dist = new THREE.Vector2(actor.mesh.position.x - this.pos.x, actor.mesh.position.z - this.pos.z).length();
      if (dist < this.radius) {
        pressedNow = true;
        break;
      }
    }

    if (pressedNow !== this.isPressed) {
      this.isPressed = pressedNow;
      if (this.isPressed) {
        this.ringMat.color.set('#38bdf8');
        this.group.position.y = -0.06;
        onEngage(this.pos.x, this.pos.z, this.id);
      } else {
        this.ringMat.color.set('#f59e0b');
        this.group.position.y = 0.05;
      }
    }
  }

  reset() {
    this.isPressed = false;
    this.ringMat.color.set('#f59e0b');
    this.group.position.y = 0.05;
  }
}

export class LaserGate {
  constructor(scene, x, z, width, requiredPlates = []) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.width = width;
    this.requiredPlates = requiredPlates;
    this.isOpen = false;

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);

    const pylonMat = new THREE.MeshStandardMaterial({ color: '#161b24', metalness: 0.9 });
    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.8, 1.4), pylonMat);
    pLeft.position.set(-width / 2, 2.4, 0);
    pLeft.castShadow = true;
    const pRight = pLeft.clone();
    pRight.position.set(width / 2, 2.4, 0);
    pRight.castShadow = true;
    this.group.add(pLeft, pRight);

    const barrierGeo = new THREE.PlaneGeometry(width, 3.8);
    this.barrierMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    this.barrierMesh = new THREE.Mesh(barrierGeo, this.barrierMat);
    this.barrierMesh.position.set(0, 2.4, 0);
    this.group.add(this.barrierMesh);

    this.scene.add(this.group);
  }

  update(onOpen) {
    const allActive = this.requiredPlates.length > 0 && this.requiredPlates.every(p => p.isPressed);
    if (allActive && !this.isOpen) {
      this.isOpen = true;
      this.barrierMesh.visible = false;
      onOpen(this.x, this.z);
    } else if (!allActive && this.isOpen) {
      this.isOpen = false;
      this.barrierMesh.visible = true;
    }

    if (!this.isOpen) {
      this.barrierMat.opacity = 0.55 + Math.sin(Date.now() * 0.012) * 0.2;
    }
  }

  blocks(actorX, actorZ, radius = 0.8) {
    if (this.isOpen) return false;
    return (
      actorX >= this.x - this.width/2 - radius &&
      actorX <= this.x + this.width/2 + radius &&
      actorZ >= this.z - 1.2 &&
      actorZ <= this.z + 1.2
    );
  }

  reset() {
    this.isOpen = false;
    this.barrierMesh.visible = true;
  }
}

export class DataTerminal {
  constructor(scene, x, z, label = 'SEC_NEXUS') {
    this.scene = scene;
    this.pos = new THREE.Vector3(x, 0, z);
    this.label = label;
    this.hackProgress = 0.0;
    this.isHacked = false;

    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.4, 2.6),
      new THREE.MeshStandardMaterial({ color: '#11141c', metalness: 0.9, roughness: 0.2 })
    );
    baseMesh.position.y = 1.2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    const ringGeo = new THREE.TorusGeometry(1.3, 0.06, 6, 24);
    this.holoMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', wireframe: true });
    this.holoRing = new THREE.Mesh(ringGeo, this.holoMat);
    this.holoRing.position.y = 3.0;
    this.group.add(this.holoRing);

    this.scene.add(this.group);
  }

  update(actors, dt, onHacked) {
    this.holoRing.rotation.y += 1.2 * dt;
    this.holoRing.rotation.x += 0.5 * dt;

    if (this.isHacked) return;

    let activeHacking = false;
    for (const actor of actors) {
      if (!actor || actor.isDead) continue;
      const dist = new THREE.Vector2(actor.mesh.position.x - this.pos.x, actor.mesh.position.z - this.pos.z).length();
      if (dist < 3.2 && actor.isHacking) {
        activeHacking = true;
        break;
      }
    }

    if (activeHacking) {
      this.hackProgress = Math.min(1.0, this.hackProgress + dt * 0.45);
      this.holoMat.color.set('#38bdf8');

      if (this.hackProgress >= 1.0) {
        this.isHacked = true;
        onHacked(this.pos.x, this.pos.z);
      }
    } else {
      this.holoMat.color.set(this.isHacked ? '#38bdf8' : '#f59e0b');
    }
  }

  reset() {
    this.hackProgress = 0.0;
    this.isHacked = false;
    this.holoMat.color.set('#f59e0b');
  }
}
