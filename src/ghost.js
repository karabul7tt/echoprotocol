// Records player inputs and positions to replay as a ghost in the next loop
import * as THREE from 'three';

export class GhostSystem {
  constructor() {
    this.runs = []; // recorded runs
    this.current = [];
  }

  record(time, player, isShooting, aimWorld) {
    this.current.push({
      t: time,
      x: player.pos.x,
      z: player.pos.z,
      rotY: player.rotationY,
      isShooting: isShooting,
      isDashing: player.isDashing,
      isHacking: player.isHacking,
      aimX: aimWorld.x,
      aimZ: aimWorld.z
    });
  }

  saveRun(loopIndex) {
    if (this.current.length > 0) {
      this.runs[loopIndex] = [...this.current];
    }
    this.current = [];
  }

  getFrame(loopIndex, time) {
    const run = this.runs[loopIndex];
    if (!run || run.length === 0) return null;

    let frame = run.find(f => f.t >= time);
    if (!frame) {
      frame = run[run.length - 1];
    }
    return frame;
  }

  reset() {
    this.runs = [];
    this.current = [];
  }
}
