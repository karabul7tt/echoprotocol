/**
 * ECHO PROTOCOL // ZERO-GC OBJECT POOL
 * Engineered by Mehmet Karabulut
 * Pre-allocated projectile & kinetic debris pooling for rock-solid 60 FPS.
 */
import * as THREE from 'three';

export class ProjectilePool {
  constructor(scene, maxBullets = 160) {
    this.scene = scene;
    this.bullets = [];

    const geo = new THREE.CylinderGeometry(0.12, 0.12, 0.9, 6);
    geo.rotateX(Math.PI / 2);

    const playerMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
    const ghostMat  = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const enemyMat  = new THREE.MeshBasicMaterial({ color: '#ef4444' });

    for (let i = 0; i < maxBullets; i++) {
      const mesh = new THREE.Mesh(geo, playerMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.bullets.push({
        mesh,
        playerMat,
        ghostMat,
        enemyMat,
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
    b.mesh.material = isEnemy ? b.enemyMat : (isGhost ? b.ghostMat : b.playerMat);
    b.mesh.visible = true;
    return b;
  }

  update(dt, walls, laserGates, onWallHit) {
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

      // Wall collision
      for (const w of walls) {
        if (b.pos.x >= w.minX && b.pos.x <= w.maxX && b.pos.z >= w.minZ && b.pos.z <= w.maxZ) {
          b.active = false;
          b.mesh.visible = false;
          onWallHit(b.pos.x, b.pos.z, b.isEnemy ? '#ef4444' : '#fbbf24');
          break;
        }
      }

      // Barrier collision
      for (const gate of laserGates) {
        if (gate.blocks(b.pos.x, b.pos.z, 0.3)) {
          b.active = false;
          b.mesh.visible = false;
          onWallHit(b.pos.x, b.pos.z, '#ef4444');
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
