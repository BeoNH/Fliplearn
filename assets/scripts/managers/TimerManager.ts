import { director } from 'cc';
import { Logger } from '../utils/Logger';
import { ON_GAME_TIMEOUT } from '../common/GameEvents';
import { GameManager } from './GameManager';

export class TimerManager {
    private static _instance: TimerManager | null = null;

    static get instance(): TimerManager {
        if (!TimerManager._instance) {
            TimerManager._instance = new TimerManager();
        }
        return TimerManager._instance;
    }
    private constructor() { }

    private remainSeconds: number | null = null;
    private elapsedSeconds: number | null = null;
    private running = false;


    startLevel(seconds: number, hasTimeLimit: boolean): void {
        this.remainSeconds = hasTimeLimit ? Math.max(0, Math.floor(seconds)) : 0;
        this.elapsedSeconds = 0;
        this.running = true;
        Logger.info('[TimerManager]', hasTimeLimit, '-start limit', this.remainSeconds);
    }

    stop(): void {
        this.running = false;
    }

    resum(): void {
        this.running = true;
    }

    reset(): void {
        this.running = false;
        this.remainSeconds = null;
        this.elapsedSeconds = null;
    }

    getRemainSeconds(): number | null {
        return this.remainSeconds;
    }

    getElapsedSeconds(): number {
        return Math.floor(this.elapsedSeconds);
    }

    update(dtSeconds: number): void {
        if (!this.running || this.remainSeconds === null) return;
        this.elapsedSeconds += dtSeconds;

        if (this.remainSeconds <= 0) return;
        const next = this.remainSeconds - dtSeconds;
        if (next <= 0) {
            this.remainSeconds = null;
            this.running = false;
            Logger.warn('[TimerManager]', 'timeout');
            GameManager.instance.onTimeout();
            return;
        }

        this.remainSeconds = next;
    }
}

