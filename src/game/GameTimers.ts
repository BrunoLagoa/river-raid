/**
 * Game-facing timers that freeze while the game is paused.
 *
 * `setTimeout` keeps running when the player opens the pause overlay, so a
 * respawn or the game-over callback could fire behind it. This wrapper stores
 * how much time was left when the game paused and reschedules it on resume.
 * `Game` owns one instance, which also keeps the timer lifecycle out of the
 * already large orchestrator.
 */
export class GameTimers {
  private respawnTimeoutId: ReturnType<typeof setTimeout> | null = null
  private gameOverTimeoutId: ReturnType<typeof setTimeout> | null = null
  private respawnAction: (() => void) | null = null
  private gameOverAction: (() => void) | null = null
  private respawnRemainingMs = 0
  private gameOverRemainingMs = 0
  private respawnDueAt = 0
  private gameOverDueAt = 0
  private paused = false

  scheduleRespawn(delayMs: number, action: () => void): void {
    this.cancelRespawn()
    this.respawnAction = action
    this.respawnRemainingMs = Math.max(0, delayMs)
    if (!this.paused) this.startRespawn()
  }

  scheduleGameOver(delayMs: number, action: () => void): void {
    this.cancelGameOver()
    this.gameOverAction = action
    this.gameOverRemainingMs = Math.max(0, delayMs)
    if (!this.paused) this.startGameOver()
  }

  /** Freeze both pending deadlines while paused; resume them on unpause. */
  setPaused(paused: boolean): void {
    if (this.paused === paused) return
    this.paused = paused

    if (paused) {
      this.freezeRespawn()
      this.freezeGameOver()
      return
    }

    if (this.respawnAction) this.startRespawn()
    if (this.gameOverAction) this.startGameOver()
  }

  isPaused(): boolean {
    return this.paused
  }

  hasPendingRespawn(): boolean {
    return this.respawnAction !== null
  }

  hasPendingGameOver(): boolean {
    return this.gameOverAction !== null
  }

  /** Cancel both deadlines and drop their callbacks (stop/restart). */
  clear(): void {
    this.cancelRespawn()
    this.cancelGameOver()
    this.paused = false
  }

  private startRespawn(): void {
    if (this.respawnRemainingMs <= 0) {
      this.fireRespawn()
      return
    }
    this.respawnDueAt = Date.now() + this.respawnRemainingMs
    this.respawnTimeoutId = setTimeout(() => {
      this.respawnTimeoutId = null
      this.fireRespawn()
    }, this.respawnRemainingMs)
  }

  private startGameOver(): void {
    if (this.gameOverRemainingMs <= 0) {
      this.fireGameOver()
      return
    }
    this.gameOverDueAt = Date.now() + this.gameOverRemainingMs
    this.gameOverTimeoutId = setTimeout(() => {
      this.gameOverTimeoutId = null
      this.fireGameOver()
    }, this.gameOverRemainingMs)
  }

  private fireRespawn(): void {
    this.respawnRemainingMs = 0
    const action = this.respawnAction
    this.respawnAction = null
    action?.()
  }

  private fireGameOver(): void {
    this.gameOverRemainingMs = 0
    const action = this.gameOverAction
    this.gameOverAction = null
    action?.()
  }

  private freezeRespawn(): void {
    if (this.respawnTimeoutId === null) return
    clearTimeout(this.respawnTimeoutId)
    this.respawnTimeoutId = null
    this.respawnRemainingMs = Math.max(0, this.respawnDueAt - Date.now())
  }

  private freezeGameOver(): void {
    if (this.gameOverTimeoutId === null) return
    clearTimeout(this.gameOverTimeoutId)
    this.gameOverTimeoutId = null
    this.gameOverRemainingMs = Math.max(0, this.gameOverDueAt - Date.now())
  }

  private cancelRespawn(): void {
    if (this.respawnTimeoutId !== null) {
      clearTimeout(this.respawnTimeoutId)
      this.respawnTimeoutId = null
    }
    this.respawnAction = null
    this.respawnRemainingMs = 0
  }

  private cancelGameOver(): void {
    if (this.gameOverTimeoutId !== null) {
      clearTimeout(this.gameOverTimeoutId)
      this.gameOverTimeoutId = null
    }
    this.gameOverAction = null
    this.gameOverRemainingMs = 0
  }
}
