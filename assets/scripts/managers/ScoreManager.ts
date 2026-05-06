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


    private state: IScoreState = { matchedPairs: 0, totalPairs: 0, bonusPairs: 0 };


    startLevel(totalPairs: number): void {
        this.state = { matchedPairs: 0, totalPairs, bonusPairs: 0 };
        Logger.info('[ScoreManager]', 'startLevel', totalPairs);
    }


    recordMatchedPair(bonus: number): void {
        this.state.matchedPairs += 1;
        this.state.bonusPairs += bonus;
    }

    getStatePair(): IScoreState {
        return this.state;
    }

    isLevelComplete(): boolean {
        return this.state.totalPairs > 0 &&
            this.state.matchedPairs >= this.state.totalPairs;
    }

    calcFinalScore(timeUsedSeconds: number): number {
        const timeToPairs = this.state.matchedPairs * (timeUsedSeconds > 0 ? 20 : 5);
        const timePenalty = Math.max(0, Math.floor(timeUsedSeconds));
        const bonusPoint = this.state.bonusPairs;
        // return Math.max(0, timeToPairs - timePenalty + bonusPoint);
        return Math.max(0, bonusPoint);
    }
}


