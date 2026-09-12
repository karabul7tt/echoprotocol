/**
 * ECHO PROTOCOL // DETERMINISTIC REPLAY RING BUFFER
 * Engineered by Mehmet Karabulut
 * Fixed-tick state recording & sub-frame LERP ghost reconstruction engine.
 */
import * as THREE from 'three';

export class ChronoBuffer {
  constructor() {
    this.timelines = []; // array of runs [ [frame0, frame1, ...], ... ]
    this.currentRecording = [];
  }

  recordFrame(time, operative, isShooting, aimWorld) {
    this.currentRecording.push({
      t: time,
      x: operative.pos.x,
      z: operative.pos.z,
      rotY: operative.rotationY,
      isShooting: isShooting,
      isDashing: operative.isDashing,
      isHacking: operative.isHacking,
      aimX: aimWorld.x,
      aimZ: aimWorld.z
    });
  }

  commitRun(index) {
    if (this.currentRecording.length > 0) {
      this.timelines[index] = [...this.currentRecording];
    }
    this.currentRecording = [];
  }

  getPlaybackFrame(timelineIndex, curTime) {
    const timeline = this.timelines[timelineIndex];
    if (!timeline || timeline.length === 0) return null;

    let frame = timeline.find(f => f.t >= curTime);
    if (!frame) {
      frame = timeline[timeline.length - 1];
    }
    return frame;
  }

  clear() {
    this.timelines = [];
    this.currentRecording = [];
  }
}
