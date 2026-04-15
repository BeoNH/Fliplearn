import { director } from 'cc';
import { ON_GAME_TIMEOUT } from '../data/GameEvents';
import { Logger } from '../utils/Logger';

export class TimerManager {
  private static _instance: TimerManager | null = null;

  static get instance(): TimerManager {
    if (!TimerManager._instance) {
      TimerManager._instance = new TimerManager();
    }
    return TimerManager._instance;
  }

  private remainSeconds: number | null = null;
  private running = false;

  private constructor() {}

  start(seconds: number): void {
    this.remainSeconds = Math.max(0, Math.floor(seconds));
    this.running = true;
    Logger.info('[TimerManager]', 'start', this.remainSeconds);
  }

  stop(): void {
    this.running = false;
  }

  reset(): void {
    this.running = false;
    this.remainSeconds = null;
  }

  getRemainSeconds(): number | null {
    return this.remainSeconds;
  }

  update(dtSeconds: number): void {
    if (!this.running || this.remainSeconds === null) return;
    if (this.remainSeconds <= 0) return;

    const next = this.remainSeconds - dtSeconds;
    if (next <= 0) {
      this.remainSeconds = 0;
      this.running = false;
      director.emit(ON_GAME_TIMEOUT, { remainSeconds: 0 });
      Logger.warn('[TimerManager]', 'timeout');
      return;
    }

    this.remainSeconds = next;
  }
}

