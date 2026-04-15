import { sys } from 'cc';
import { Logger } from '../utils/Logger';

interface IScoreState {
  matchedPairs: number;
  totalPairs: number;
  moves: number;
}

export class ScoreManager {
  private static _instance: ScoreManager | null = null;

  static get instance(): ScoreManager {
    if (!ScoreManager._instance) {
      ScoreManager._instance = new ScoreManager();
    }
    return ScoreManager._instance;
  }

  private state: IScoreState = { matchedPairs: 0, totalPairs: 0, moves: 0 };

  private constructor() {}

  startLevel(totalPairs: number): void {
    this.state = { matchedPairs: 0, totalPairs, moves: 0 };
    Logger.info('[ScoreManager]', 'startLevel', totalPairs);
  }

  recordMove(): void {
    this.state.moves += 1;
  }

  recordMatchedPair(): void {
    this.state.matchedPairs += 1;
  }

  getMatchedPairs(): number {
    return this.state.matchedPairs;
  }

  getTotalPairs(): number {
    return this.state.totalPairs;
  }

  calcFinalScore(timeUsedSeconds: number): number {
    const base = this.state.matchedPairs * 100;
    const movePenalty = Math.max(0, this.state.moves - this.state.totalPairs) * 10;
    const timePenalty = Math.max(0, Math.floor(timeUsedSeconds)) * 1;
    return Math.max(0, base - movePenalty - timePenalty);
  }

  getLocalBest(topicId: string): number {
    const key = this.bestKey(topicId);
    const raw = sys.localStorage.getItem(key);
    const num = raw ? Number(raw) : 0;
    return Number.isFinite(num) ? num : 0;
  }

  updateLocalBest(topicId: string, score: number): boolean {
    const best = this.getLocalBest(topicId);
    if (score <= best) return false;
    sys.localStorage.setItem(this.bestKey(topicId), String(score));
    Logger.info('[ScoreManager]', 'new local best', topicId, score);
    return true;
  }

  private bestKey(topicId: string): string {
    return `fliplearn.best.${topicId}`;
  }
}

