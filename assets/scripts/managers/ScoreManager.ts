import { Logger } from '../utils/Logger';
import { IScoreState } from './../common/GameTypes';

export class ScoreManager {
    private static _instance: ScoreManager | null = null;

    static get instance(): ScoreManager {
        if (!ScoreManager._instance) {
            ScoreManager._instance = new ScoreManager();
        }
        return ScoreManager._instance;
    }
    private constructor() { }


    private state: IScoreState = { matchedPairs: 0, totalPairs: 0 };


    startLevel(totalPairs: number): void {
        this.state = { matchedPairs: 0, totalPairs };
        Logger.info('[ScoreManager]', 'startLevel', totalPairs);
    }


    recordMatchedPair(): void {
        this.state.matchedPairs += 1;
    }

    isLevelComplete(): boolean {
        return this.state.totalPairs > 0 &&
            this.state.matchedPairs >= this.state.totalPairs;
    }

    calcFinalScore(timeUsedSeconds: number): number {
        const base = this.state.matchedPairs * 100;
        const timePenalty = Math.max(0, Math.floor(timeUsedSeconds)) * 1;
        return Math.max(0, base - timePenalty);
    }
}


