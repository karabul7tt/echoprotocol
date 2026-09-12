// Player character controller with movement, dash, and laser aiming
import * as THREE from 'three';

export class Player {
  constructor(scene, isGhost = false, color = '#38bdf8') {
    this.scene = scene;
    this.isGhost = isGhost;
    this.hp = 100;
    this.maxHp = 100;
    this.isDead = false;
    this.pos = new THREE.Vector3(0, 0, 18);
    this.speed = 13.5;
    this.rotationY = 0;

    this.dashCooldown = 0;
    this.dashDuration = 0;
    this.isDashing = false;
    this.isHacking = false;
    this.shootTimer = 0;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    // Armor material
    const mat = isGhost
      ? new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.6 })
      : new THREE.MeshStandardMaterial({ color: '#181d27', metalness: 0.95, roughness: 0.25 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.8), mat);
    torso.position.y = 1.2;
    torso.castShadow = !isGhost;
    this.mesh.add(torso);

    // Core light
    const core = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.35, 0.1),
      new THREE.MeshBasicMaterial({ color: isGhost ? color : '#f59e0b' })
    );
    core.position.set(0, 1.35, 0.42);
    this.mesh.add(core);

    // Helmet & visor
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.7), mat);
    helmet.position.set(0, 2.05, 0);
    helmet.castShadow = !isGhost;
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.16, 0.15),
      new THREE.MeshBasicMaterial({ color: isGhost ? color : '#f59e0b' })
    );
    visor.position.set(0, 2.05, 0.35);
    this.mesh.add(helmet, visor);

    // Gun
    const gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.2, 1.3),
      new THREE.MeshStandardMaterial({ color: '#0c0e14', metalness: 0.9 })
    );
    gun.position.set(0.65, 1.1, 0.7);
    gun.castShadow = !isGhost;
    this.mesh.add(gun);

    // Laser pointer
    if (!isGhost) {
      const laserGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.65, 1.1, 0.9),
        new THREE.Vector3(0.65, 1.1, 18)
      ]);
      const laserMat = new THREE.LineBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.45 });
      this.laser = new THREE.Line(laserGeo, laserMat);
      this.mesh.add(this.laser);
    }

    this.scene.add(this.mesh);
  }

  takeDamage(amount, onDamage, onDeath) {
    if (this.isDead || this.isDashing) return;
    this.hp = Math.max(0, this.hp - amount);
    onDamage(this.pos.x, this.pos.z, amount);

    if (this.hp <= 0) {
      this.isDead = true;
      this.mesh.visible = false;
      onDeath(this.pos.x, this.pos.z);
    }
  }

  reset(x = 0, z = 18) {
    this.hp = this.maxHp;
    this.isDead = false;
    this.mesh.visible = true;
    this.pos.set(x, 0, z);
    this.mesh.position.copy(this.pos);
    this.dashCooldown = 0;
    this.dashDuration = 0;
    this.isDashing = false;
    this.isHacking = false;
  }
}
