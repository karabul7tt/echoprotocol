/**
 * ECHO PROTOCOL // TACTICAL OPERATIVE & PHANTOM CLONE CONTROLLER
 * Engineered by Mehmet Karabulut
 */
import * as THREE from 'three';

export class Operative {
  constructor(scene, isGhost = false, ghostColor = '#38bdf8') {
    this.scene = scene;
    this.isGhost = isGhost;
    this.hp = 100;
    this.maxHp = 100;
    this.isDead = false;
    this.pos = new THREE.Vector3(0, 0, 18);
    this.speed = 13.5;
    this.rotationY = 0;

    this.dashCooldown = 0.0;
    this.dashDuration = 0.0;
    this.isDashing = false;
    this.isHacking = false;
    this.shootTimer = 0.0;

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    const armorMat = isGhost
      ? new THREE.MeshBasicMaterial({
          color: ghostColor,
          wireframe: true,
          transparent: true,
          opacity: 0.6
        })
      : new THREE.MeshStandardMaterial({
          color: '#181d27',
          metalness: 0.95,
          roughness: 0.25
        });

    // Armored Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.8), armorMat);
    torso.position.y = 1.2;
    torso.castShadow = !isGhost;
    this.mesh.add(torso);

    // Illuminated Reactor Core
    const coreMat = new THREE.MeshBasicMaterial({ color: isGhost ? ghostColor : '#f59e0b' });
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.1), coreMat);
    core.position.set(0, 1.35, 0.42);
    this.mesh.add(core);

    // Angular Helmet & Visor
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.6, 0.7), armorMat);
    helmet.position.set(0, 2.05, 0);
    helmet.castShadow = !isGhost;
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.16, 0.15),
      new THREE.MeshBasicMaterial({ color: isGhost ? ghostColor : '#f59e0b' })
    );
    visor.position.set(0, 2.05, 0.35);
    this.mesh.add(helmet, visor);

    // Heavy Kinetic Rail Weapon
    const weaponGroup = new THREE.Group();
    weaponGroup.position.set(0.65, 1.1, 0.3);
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.2, 1.3),
      new THREE.MeshStandardMaterial({ color: '#0c0e14', metalness: 0.9 })
    );
    barrel.position.z = 0.4;
    barrel.castShadow = !isGhost;
    weaponGroup.add(barrel);
    this.mesh.add(weaponGroup);

    // Laser Sight Pointer (Player only)
    if (!isGhost) {
      const laserPoints = [new THREE.Vector3(0.65, 1.1, 0.9), new THREE.Vector3(0.65, 1.1, 18)];
      const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
      const laserMat = new THREE.LineBasicMaterial({ color: '#ef4444', transparent: true, opacity: 0.45 });
      this.laserLine = new THREE.Line(laserGeo, laserMat);
      this.mesh.add(this.laserLine);
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
    this.dashCooldown = 0.0;
    this.dashDuration = 0.0;
    this.isDashing = false;
    this.isHacking = false;
  }
}
