// Object pool for bullets and particle effects to avoid GC stutter
import * as THREE from 'three';

export class BulletPool {
  constructor(scene, max = 150) {
    this.scene = scene;
    this.bullets = [];

    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6);
    geo.rotateX(Math.PI / 2);

    const pMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' }); // Player: amber
    const gMat = new THREE.MeshBasicMaterial({ color: '#38bdf8' }); // Ghost: blue
    const eMat = new THREE.MeshBasicMaterial({ color: '#ef4444' }); // Enemy: red

    for (let i = 0; i < max; i++) {
      const mesh = new THREE.Mesh(geo, pMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.bullets.push({
        mesh,
        pMat, gMat, eMat,
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        isEnemy: false,
        isGhost: false,
        damage: 25
      });
    }
  }

  spawn(x, z, dirX, dirZ, speed = 40, isEnemy = false, isGhost = false, damage = 25) {
    const b = this.bullets.find(item => !item.active);
    if (!b) return null;

    b.active = true;
    b.isEnemy = isEnemy;
    b.isGhost = isGhost;
    b.damage = damage;
    b.life = 1.3;

    b.pos.set(x, 1.1, z);
    b.vel.set(dirX, 0, dirZ).normalize().multiplyScalar(speed);

    b.mesh.position.copy(b.pos);
    b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.vel.clone().normalize());
    b.mesh.material = isEnemy ? b.eMat : (isGhost ? b.gMat : b.pMat);
    b.mesh.visible = true;
    return b;
  }

  update(dt, walls, gates, onHit) {
    for (const b of this.bullets) {
      if (!b.active) continue;

      b.life -= dt;
      if (b.life <= 0) {
        b.active = false;
        b.mesh.visible = false;
        continue;
      }

      b.pos.addScaledVector(b.vel, dt);
      b.mesh.position.copy(b.pos);

      // Check wall collisions
      for (const w of walls) {
        if (b.pos.x >= w.minX && b.pos.x <= w.maxX && b.pos.z >= w.minZ && b.pos.z <= w.maxZ) {
          b.active = false;
          b.mesh.visible = false;
          onHit(b.pos.x, b.pos.z, b.isEnemy ? '#ef4444' : '#fbbf24');
          break;
        }
      }

      // Check laser gate collisions
      for (const gate of gates) {
        if (gate.blocks(b.pos.x, b.pos.z, 0.3)) {
          b.active = false;
          b.mesh.visible = false;
          onHit(b.pos.x, b.pos.z, '#ef4444');
          break;
        }
      }
    }
  }

  clear() {
    for (const b of this.bullets) {
      b.active = false;
      b.mesh.visible = false;
    }
  }
}
