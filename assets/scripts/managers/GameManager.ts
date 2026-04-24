import BroadcastReceiver from "../common/BroadcastReceiver";
import { ON_LEVEL_INIT } from "../common/GameEvents";
import { IGameInfo, IGameSession, ILevelConfig, ILevelInitEvent } from "../common/GameTypes";
import { PopupDoneLevel } from "../components/Popup/PopupDoneLevel";
import { PopupResult } from "../components/Popup/PopupResult";
import { Logger } from "../utils/Logger";
import { CardManager } from "./CardManager";
import { ScoreManager } from "./ScoreManager";
import { TimerManager } from "./TimerManager";

export class GameManager {
    private static _instance: GameManager | null = null;

    static get instance(): GameManager {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }
    private constructor() { }

    private session: IGameSession | null = null;

    levelConfig: ILevelConfig[] = [];
    GameInfo: IGameInfo;

    initSession() {
        this.reset();
        this.startSession();
    }

    reset(): void {
        TimerManager.instance.reset();
        CardManager.instance.reset();
    }

    private startSession(): void {
        const config = this.levelConfig;
        const startTimeMs = Date.now();
        const session: IGameSession = {
            sessionId: this.newSessionId(),
            config,
            currentLevel: 0,
            finalScore: 0,
            timeUsedSec: 0,
            startTimeMs,
        };
        this.session = null;
        this.session = session;

        this.initLevel(0);
        // director.emit(ON_GAME_START, { sessionId: session.sessionId, topicId });
        Logger.info('[GameManager]', 'startSession', session.sessionId);
    }

    private initLevel(levelIndex: number): void {
        const session = this.session;
        if (!session) return;

        if (levelIndex < 0 || levelIndex >= session.config.length) return;
        session.currentLevel = levelIndex;

        const level = session.config[levelIndex];
        const cards = CardManager.instance.initListCard(level);

        ScoreManager.instance.startLevel(level.pairs.length);

        const limit = level.timeLimit ?? 60;
        TimerManager.instance.startLevel(limit, level.hasTimeLimit);

        const payLoad: ILevelInitEvent = { level: level, cards: cards.slice(), rows: level.rows, cols: level.cols }
        BroadcastReceiver.send(ON_LEVEL_INIT, payLoad);
    }

    checkLevelComplete(): void {
        const session = this.session;
        if (!session) return;

        if (!ScoreManager.instance.isLevelComplete()) return;

        // director.emit(ON_LEVEL_COMPLETE, payload);
        this.updateSession();

        const next = session.currentLevel + 1;
        if (next < session.config.length) {
            TimerManager.instance.stop();
            PopupDoneLevel.show()
                .then((result) => {
                    if (result === 'next') {
                        this.initLevel(next);
                    }
                    else if (result === 'stop') {
                        void this.endSession();
                    }
                })
            return;
        }

        setTimeout(() => {
            void this.endSession();
        }, 1000);
    }

    onTimeout(): void {
        this.updateSession();
        void this.endSession();
    }

    getGameStats() {
        const session = this.session;
        if (!session) return null;

        return {
            score: session.finalScore,
            time: session.timeUsedSec
        }
    }

    private updateSession() {
        const session = this.session;
        if (!session) return;

        const elapSec = TimerManager.instance.getElapsedSeconds();
        const hasTime = session.config[session.currentLevel].hasTimeLimit;
        const score = ScoreManager.instance.calcFinalScore(hasTime ? elapSec : 0);
        session.timeUsedSec += elapSec;
        session.finalScore += score;

        Logger.info('[GameManager]', 'updateSession', elapSec, score);
    }

    private async endSession(): Promise<void> {
        const session = this.session;
        if (!session) return;

        TimerManager.instance.stop();
        PopupResult.show();

        Logger.info('[GameManager]', 'complete');
    }


    private newSessionId(): string {
        const t = Date.now().toString(36);
        const r = Math.floor(Math.random() * 1_000_000).toString(36);
        return `${t}-${r}`;
    }
}


