import * as THREE from 'three';
import { clamp, damp } from '../engine/utils.js';

const EYE_HEIGHT = 1.52;
const WALK_FOV = 74;
const SPRINT_FOV = 80;

export class Player {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = Math.PI;
    this.pitch = -0.04;
    this.onGround = true;
    this.groundY = 0;
    this.groundFn = () => 0;
    this.boundsCenter = new THREE.Vector2(0, 0);
    this.boundsRadius = 60;

    this.walkSpeed = 5.6;
    this.sprintSpeed = 8.4;
    this.jumpSpeed = 7.4;
    this.gravity = 21;

    this.coyote = 0;
    this.jumpBuffer = 0;
    this.wasJumpHeld = false;
    this.walkPhase = 0;
    this.bobAmp = 0;
    this.landDip = 0;
    this.stepAccumulator = 0;
    this.sprinting = false;
    this.locked = false;

    this.onStep = null;
    this.onJump = null;
    this.onLand = null;
    this.onEdge = null;

    camera.rotation.order = 'YXZ';
    camera.fov = WALK_FOV;
    camera.updateProjectionMatrix();
  }

  place(x, z, yaw = this.yaw) {
    this.position.set(x, this.groundFn(x, z), z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = -0.03;
    this.onGround = true;
    this.walkPhase = 0;
    this.landDip = 0;
    this._syncCamera(0);
  }

  setWorld(groundFn, center, radius) {
    this.groundFn = groundFn;
    this.boundsCenter.set(center.x, center.z);
    this.boundsRadius = radius;
  }

  look(dx, dy) {
    const s = this.input.sensitivity;
    this.yaw -= dx * s;
    this.pitch = clamp(this.pitch - dy * s, -1.2, 1.15);
  }

  get forwardVector() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  update(dt) {
    const input = this.input;

    const look = input.consumeLook();
    this.look(look.dx, look.dy);
    this.yaw -= input.turning * 2.4 * dt;

    // ---- horizontal movement ----
    let wishX = input.strafe;
    let wishZ = input.forward;
    const wishLen = Math.hypot(wishX, wishZ);
    if (wishLen > 1) {
      wishX /= wishLen;
      wishZ /= wishLen;
    }
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    const dirX = cos * wishX - sin * wishZ;
    const dirZ = -sin * wishX - cos * wishZ;

    this.sprinting = input.sprint && wishZ > 0.1;
    const speed = this.sprinting ? this.sprintSpeed : this.walkSpeed;
    const accel = this.onGround ? 17 : 6.5;
    this.velocity.x = damp(this.velocity.x, dirX * speed, accel, dt);
    this.velocity.z = damp(this.velocity.z, dirZ * speed, accel, dt);

    // ---- jumping: coyote time + input buffer = very forgiving ----
    const jumpHeld = input.jumpHeld;
    if (jumpHeld && !this.wasJumpHeld) this.jumpBuffer = 0.16;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.wasJumpHeld = jumpHeld;

    if (this.onGround) this.coyote = 0.14;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.velocity.y = this.jumpSpeed;
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.onGround = false;
      this.onJump?.();
    }

    this.velocity.y -= this.gravity * dt;

    // ---- integrate ----
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.position.y += this.velocity.y * dt;

    // ---- soft island edge: a gentle magic wall, never a fall ----
    const cx = this.position.x - this.boundsCenter.x;
    const cz = this.position.z - this.boundsCenter.y;
    const dist = Math.hypot(cx, cz);
    const maxDist = this.boundsRadius * 0.93;
    if (dist > maxDist) {
      const nx = cx / dist;
      const nz = cz / dist;
      this.position.x = this.boundsCenter.x + nx * maxDist;
      this.position.z = this.boundsCenter.y + nz * maxDist;
      const outward = this.velocity.x * nx + this.velocity.z * nz;
      if (outward > 0) {
        this.velocity.x -= nx * outward;
        this.velocity.z -= nz * outward;
      }
      this.onEdge?.();
    }

    // ---- ground ----
    const gy = this.groundFn(this.position.x, this.position.z);
    this.groundY = gy;
    if (this.position.y <= gy + 0.001) {
      const impact = -this.velocity.y;
      this.position.y = gy;
      this.velocity.y = 0;
      if (!this.onGround && impact > 3.5) {
        this.landDip = clamp(impact * 0.012, 0, 0.15);
        this.onLand?.(impact);
      }
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // ---- footsteps + head bob ----
    const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.onGround && planarSpeed > 0.6) {
      this.walkPhase += dt * planarSpeed * 1.55;
      this.stepAccumulator += dt * planarSpeed;
      if (this.stepAccumulator > 2.1) {
        this.stepAccumulator = 0;
        this.onStep?.();
      }
    }
    this.bobAmp = damp(this.bobAmp, this.onGround ? clamp(planarSpeed / this.walkSpeed, 0, 1.25) : 0, 9, dt);
    this.landDip = damp(this.landDip, 0, 9, dt);

    this._syncCamera(dt, planarSpeed);
  }

  _syncCamera(dt, planarSpeed = 0) {
    const bobY = Math.sin(this.walkPhase * 2) * 0.038 * this.bobAmp;
    const bobX = Math.cos(this.walkPhase) * 0.03 * this.bobAmp;
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    this.camera.position.set(
      this.position.x + rightX * bobX,
      this.position.y + EYE_HEIGHT + bobY - this.landDip,
      this.position.z + rightZ * bobX
    );
    const roll = -Math.sin(this.walkPhase) * 0.014 * this.bobAmp;
    this.camera.rotation.set(this.pitch, this.yaw, roll);

    const targetFov = this.sprinting && planarSpeed > 6 ? SPRINT_FOV : WALK_FOV;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = damp(this.camera.fov, targetFov, 6, dt || 0.016);
      this.camera.updateProjectionMatrix();
    }
  }

  get eyePosition() {
    return this.camera.position;
  }

  forwardFlat(out = new THREE.Vector3()) {
    return out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
}
