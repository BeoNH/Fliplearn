import { director } from 'cc';
import { DEFAULT_TIME_LIMIT_SECONDS } from '../data/GameConstants';
import {
  ON_CARD_FLIP,
  ON_CARD_MATCHED,
  ON_CARD_MISMATCH,
  ON_GAME_COMPLETE,
  ON_GAME_RESET,
  ON_GAME_START,
  ON_GAME_TIMEOUT,
  ON_REQUEST_START_SESSION,
  ON_LEVEL_COMPLETE,
  ON_LEVEL_INIT,
} from '../data/GameEvents';
import type {
  ICardFlipEvent,
  IGameCompleteEvent,
  IGameConfig,
  IGameSession,
  ILevelCompleteEvent,
  ILevelInitEvent,
  IRequestStartSessionEvent,
} from '../data/GameTypes';
import { CardManager } from './CardManager';
import { NetworkManager } from './NetworkManager';
import { ScoreManager } from './ScoreManager';
import { TimerManager } from './TimerManager';
import { Logger } from '../utils/Logger';

export class GameManager {
  private static _instance: GameManager | null = null;

  static get instance(): GameManager {
    if (!GameManager._instance) {
      GameManager._instance = new GameManager();
    }
    return GameManager._instance;
  }

  private session: IGameSession | null = null;

  private constructor() {}

  init(): void {
    director.on(ON_CARD_FLIP, this.onCardFlip, this);
    director.on(ON_CARD_MATCHED, this.onCardMatched, this);
    director.on(ON_CARD_MISMATCH, this.onCardMismatch, this);
    director.on(ON_GAME_TIMEOUT, this.onTimeout, this);
    director.on(ON_REQUEST_START_SESSION, this.onRequestStartSession, this);
  }

  destroy(): void {
    director.off(ON_CARD_FLIP, this.onCardFlip, this);
    director.off(ON_CARD_MATCHED, this.onCardMatched, this);
    director.off(ON_CARD_MISMATCH, this.onCardMismatch, this);
    director.off(ON_GAME_TIMEOUT, this.onTimeout, this);
    director.off(ON_REQUEST_START_SESSION, this.onRequestStartSession, this);
  }

  startSession(config: IGameConfig, topicId: string | null): void {
    const startTimeMs = Date.now();
    const session: IGameSession = {
      sessionId: this.newSessionId(),
      topicId,
      config,
      currentLevel: 0,
      startTimeMs,
    };
    this.session = session;

    this.initLevel(0);
    director.emit(ON_GAME_START, { sessionId: session.sessionId, topicId });
    Logger.info('[GameManager]', 'startSession', session.sessionId, topicId);
  }

  private onRequestStartSession(evt: IRequestStartSessionEvent): void {
    this.reset();
    this.startSession(evt.config, evt.topicId);
  }

  reset(): void {
    TimerManager.instance.reset();
    CardManager.instance.reset();
    this.session = null;
    director.emit(ON_GAME_RESET);
  }

  update(dtSeconds: number): void {
    TimerManager.instance.update(dtSeconds);
  }

  private initLevel(levelIndex: number): void {
    const session = this.session;
    if (!session) return;
    if (levelIndex < 0 || levelIndex >= session.config.levels.length) return;

    session.currentLevel = levelIndex;
    const level = session.config.levels[levelIndex];
    const cards = CardManager.instance.initLevel(level);
    ScoreManager.instance.startLevel(level.cardPairs.length);

    const initPayload: ILevelInitEvent = { levelIndex, cards: cards.slice() };
    director.emit(ON_LEVEL_INIT, initPayload);

    if (session.config.hasTimeLimit) {
      const limit = session.config.timeLimitSeconds ?? DEFAULT_TIME_LIMIT_SECONDS;
      TimerManager.instance.start(limit);
    } else {
      TimerManager.instance.stop();
    }
  }

  private async endSession(): Promise<void> {
    const session = this.session;
    if (!session) return;

    TimerManager.instance.stop();
    const timeUsedSeconds = Math.max(0, Math.floor((Date.now() - session.startTimeMs) / 1000));
    const finalScore = ScoreManager.instance.calcFinalScore(timeUsedSeconds);

    const topicId = session.topicId ?? 'default';
    let isNewBestScore = false;
    let currentBest = ScoreManager.instance.getLocalBest(topicId);

    try {
      const res = await NetworkManager.instance.saveScore({
        score: finalScore,
        time: timeUsedSeconds,
        topicId,
      });
      isNewBestScore = res.newBestScore;
      currentBest = res.currentBest;
      Logger.info('[GameManager]', 'saveScore success', res);
    } catch (error) {
      Logger.warn('[GameManager]', 'saveScore failed — offline mode', error);
    } finally {
      const localNewBest = ScoreManager.instance.updateLocalBest(topicId, finalScore);
      if (localNewBest) {
        isNewBestScore = true;
        currentBest = finalScore;
      }
    }

    const payload: IGameCompleteEvent = {
      finalScore,
      timeUsedSeconds,
      topicId: session.topicId,
    };
    director.emit(ON_GAME_COMPLETE, payload);
    Logger.info('[GameManager]', 'complete', payload, { isNewBestScore, currentBest });
  }

  private onCardFlip(evt: ICardFlipEvent): void {
    CardManager.instance.flipCard(evt.cardId);
  }

  private onCardMatched(): void {
    ScoreManager.instance.recordMove();
    ScoreManager.instance.recordMatchedPair();
    this.checkLevelComplete();
  }

  private onCardMismatch(): void {
    ScoreManager.instance.recordMove();
  }

  private checkLevelComplete(): void {
    const session = this.session;
    if (!session) return;
    const totalPairs = ScoreManager.instance.getTotalPairs();
    if (totalPairs <= 0) return;
    if (ScoreManager.instance.getMatchedPairs() < totalPairs) return;

    const payload: ILevelCompleteEvent = { levelIndex: session.currentLevel };
    director.emit(ON_LEVEL_COMPLETE, payload);

    const next = session.currentLevel + 1;
    if (next < session.config.levels.length) {
      this.initLevel(next);
      return;
    }

    void this.endSession();
  }

  private onTimeout(): void {
    void this.endSession();
  }

  private newSessionId(): string {
    const t = Date.now().toString(36);
    const r = Math.floor(Math.random() * 1_000_000).toString(36);
    return `${t}-${r}`;
  }
}

