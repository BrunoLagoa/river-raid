import {
  BASE_SCROLL_SPEED,
  MAX_SCROLL_SPEED,
  SCROLL_ACCEL,
  SPEED_MOD_FAST,
  SPEED_MOD_SLOW,
  SLOW_MOTION_FACTOR,
  DEFAULT_LIVES,
} from './constants'

export class GameState {
  lives = DEFAULT_LIVES
  gameTime = 0
  scrollSpeed = BASE_SCROLL_SPEED
  slowMotionTimer = 0
  fuelFlashTimer = 0

  reset(): void {
    this.lives = DEFAULT_LIVES
    this.gameTime = 0
    this.scrollSpeed = BASE_SCROLL_SPEED
    this.slowMotionTimer = 0
    this.fuelFlashTimer = 0
  }

  updateSpeed(playerKeys: Set<string>): number {
    const baseSpeed = Math.min(MAX_SCROLL_SPEED, BASE_SCROLL_SPEED + this.gameTime * SCROLL_ACCEL)
    let speedMod = 1.0
    if (playerKeys.has('ArrowUp')) speedMod = SPEED_MOD_FAST
    if (playerKeys.has('ArrowDown')) speedMod = SPEED_MOD_SLOW
    this.scrollSpeed = baseSpeed * speedMod
    return speedMod
  }

  updateTime(dt: number): void {
    this.gameTime += dt
    if (this.slowMotionTimer > 0) {
      this.slowMotionTimer -= dt
    }
  }

  getEnvDt(dt: number): number {
    return this.slowMotionTimer > 0 ? dt * SLOW_MOTION_FACTOR : dt
  }
}
