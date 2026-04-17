import BroadcastReceiver from "../common/BroadcastReceiver";
import { ON_LEVEL_INIT } from "../common/GameEvents";
import { IGameSession, ILevelConfig, ILevelInitEvent } from "../common/GameTypes";
import { Logger } from "../utils/Logger";
import { CardManager } from "./CardManager";

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

    initSession() {
        this.reset();
        this.startSession();
    }

    reset(): void {
        // TimerManager.instance.reset();
        CardManager.instance.reset();
        // director.emit(ON_GAME_RESET);
    }

    startSession(): void {
        const config = this.levelConfig;
        const startTimeMs = Date.now();
        const session: IGameSession = {
            sessionId: this.newSessionId(),
            config,
            currentLevel: 0,
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

        const payLoad: ILevelInitEvent = { cards: cards.slice(), rows: level.rows, cols: level.cols }
        BroadcastReceiver.send(ON_LEVEL_INIT, payLoad);

        // ScoreManager.instance.startLevel(level.cardPairs.length);

        // if (level.hasTimeLimit) {
        //     const limit = level.timeLimit ?? 60;
        //     TimerManager.instance.start(limit);
        // } else {
        //     TimerManager.instance.stop();
        // }
    }

    private newSessionId(): string {
        const t = Date.now().toString(36);
        const r = Math.floor(Math.random() * 1_000_000).toString(36);
        return `${t}-${r}`;
    }
}


