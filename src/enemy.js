// Enemy AI (Drones, Turrets, and Boss Mech)
import * as THREE from 'three';

export class Enemy {
  constructor(scene, type = 'drone', x = 0, z = -10, hp = 60) {
    this.scene = scene;
    this.type = type;
    this.hp = hp;
    this.maxHp = hp;
    this.isDead = false;
    this.pos = new THREE.Vector3(x, 0, z);
    this.target = null;
    this.shootCooldown = 1.0 + Math.random() * 0.8;
    this.rotY = 0;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    if (type === 'drone') {
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.9, 0.5, 6),
        new THREE.MeshStandardMaterial({ color: '#161b24', metalness: 0.9, roughness: 0.3 })
      );
      core.position.y = 1.9;
      core.castShadow = true;
      this.mesh.add(core);

      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#ef4444' })
      );
      eye.position.set(0, 1.85, 0.6);
      this.mesh.add(eye);
    } else if (type === 'turret') {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2.1, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: '#11141c', metalness: 0.95 })
      );
      base.position.y = 0.6;
      base.castShadow = true;
      this.mesh.add(base);

      const gun = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.5, 2.2),
        new THREE.MeshBasicMaterial({ color: '#181d27' })
      );
      gun.position.set(0, 1.5, 0.8);
      gun.castShadow = true;
      this.mesh.add(gun);
    } else if (type === 'boss') {
      const titan = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 4.0, 5.2),
        new THREE.MeshStandardMaterial({ color: '#11141c', metalness: 0.95, roughness: 0.2 })
      );
      titan.position.y = 2.4;
      titan.castShadow = true;
      this.mesh.add(titan);

      this.coreMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.7, 16, 16),
        new THREE.MeshBasicMaterial({ color: '#ef4444' })
      );
      this.coreMesh.position.y = 2.4;
      this.mesh.add(this.coreMesh);

      const bLeft = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 4.2), new THREE.MeshBasicMaterial({ color: '#161b24' }));
      bLeft.position.set(-2.6, 2.4, 1.6);
      bLeft.castShadow = true;
      const bRight = bLeft.clone();
      bRight.position.x = 2.6;
      bRight.castShadow = true;
      this.mesh.add(bLeft, bRight);
    }

    this.scene.add(this.mesh);
  }

  update(actors, dt, onShoot) {
    if (this.isDead) return;

    // Target the closest active entity (Player OR Ghost Clone Decoy)
    let closest = null;
    let minDist = 999;
    for (const a of actors) {
      if (!a || a.isDead || !a.mesh.visible) continue;
      const d = this.pos.distanceTo(a.pos);
      if (d < minDist) {
        minDist = d;
        closest = a;
      }
    }
    this.target = closest;

    if (this.target) {
      const dx = this.target.pos.x - this.pos.x;
      const dz = this.target.pos.z - this.pos.z;
      this.rotY = Math.atan2(dx, dz);
      this.mesh.rotation.y = this.rotY;

      if (this.type === 'drone' && minDist > 6.0) {
        const spd = 4.5 * dt;
        this.pos.x += Math.sin(this.rotY) * spd;
        this.pos.z += Math.cos(this.rotY) * spd;
      }

      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0 && minDist < 32) {
        this.shootCooldown = (this.type === 'boss') ? 0.6 : (1.4 + Math.random() * 0.6);
        const mx = this.pos.x + Math.sin(this.rotY) * 1.6;
        const mz = this.pos.z + Math.cos(this.rotY) * 1.6;
        onShoot(mx, mz, Math.sin(this.rotY), Math.cos(this.rotY));
      }
    }

    this.mesh.position.copy(this.pos);
  }

  takeDamage(amount, onDamage, onDeath) {
    if (this.isDead) return;
    this.hp -= amount;
    onDamage(this.pos.x, this.pos.z, amount, this.hp / this.maxHp);

    if (this.hp <= 0) {
      this.isDead = true;
      this.mesh.visible = false;
      onDeath(this.pos.x, this.pos.z, this.type === 'boss');
    }
  }

  reset() {
    this.hp = this.maxHp;
    this.isDead = false;
    this.mesh.visible = true;
    this.shootCooldown = 1.0;
  }
}
