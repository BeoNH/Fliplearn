import { director } from 'cc';
import { ON_LEADERBOARD_UPDATED, ON_REQUEST_LEADERBOARD } from '../data/GameEvents';
import type { ILeaderboardUpdatedEvent } from '../data/GameTypes';
import { NetworkManager } from './NetworkManager';
import { Logger } from '../utils/Logger';

export class LeaderboardManager {
  private static _instance: LeaderboardManager | null = null;

  static get instance(): LeaderboardManager {
    if (!LeaderboardManager._instance) {
      LeaderboardManager._instance = new LeaderboardManager();
    }
    return LeaderboardManager._instance;
  }

  private constructor() {}

  init(): void {
    director.on(ON_REQUEST_LEADERBOARD, this.onRequestLeaderboard, this);
  }

  destroy(): void {
    director.off(ON_REQUEST_LEADERBOARD, this.onRequestLeaderboard, this);
  }

  private async onRequestLeaderboard(): Promise<void> {
    try {
      const entries = await NetworkManager.instance.getLeaderboard();
      const payload: ILeaderboardUpdatedEvent = { entries, error: null };
      director.emit(ON_LEADERBOARD_UPDATED, payload);
    } catch (e) {
      Logger.error('[LeaderboardManager]', 'getLeaderboard failed', e);
      const payload: ILeaderboardUpdatedEvent = { entries: [], error: this.errorToString(e) };
      director.emit(ON_LEADERBOARD_UPDATED, payload);
    }
  }

  private errorToString(e: unknown): string {
    if (e instanceof Error) return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
}

