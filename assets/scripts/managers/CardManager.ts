import { director } from 'cc';
import { FLIP_DELAY_MS, MAX_FLIP_COUNT_PER_TURN } from '../data/GameConstants';
import { ON_CARD_MATCHED, ON_CARD_MISMATCH, ON_CARD_STATE_CHANGED } from '../data/GameEvents';
import type { ICardData, ICardMismatchEvent, ICardMatchedEvent, ILevelConfig } from '../data/GameTypes';
import { CardState } from '../data/GameTypes';
import { Logger } from '../utils/Logger';

export class CardManager {
  private static _instance: CardManager | null = null;

  static get instance(): CardManager {
    if (!CardManager._instance) {
      CardManager._instance = new CardManager();
    }
    return CardManager._instance;
  }

  private cards: ICardData[] = [];
  private stateByCardId: Map<string, CardState> = new Map();
  private flipped: string[] = [];
  private mismatchTimerId: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  initLevel(level: ILevelConfig): ICardData[] {
    this.clearTimers();
    this.flipped = [];

    const cards: ICardData[] = [];
    for (const pair of level.cardPairs) {
      cards.push(pair.cardA, pair.cardB);
    }
    this.cards = this.shuffle(cards);
    this.stateByCardId = new Map(this.cards.map((c) => [c.cardId, CardState.FACE_DOWN]));
    Logger.info('[CardManager]', 'initLevel', level.levelIndex, 'cards', this.cards.length);
    return this.cards;
  }

  getCards(): readonly ICardData[] {
    return this.cards;
  }

  getState(cardId: string): CardState {
    return this.stateByCardId.get(cardId) ?? CardState.FACE_DOWN;
  }

  flipCard(cardId: string): void {
    if (this.mismatchTimerId) return;
    if (this.flipped.length >= MAX_FLIP_COUNT_PER_TURN) return;

    const state = this.getState(cardId);
    if (state !== CardState.FACE_DOWN) return;

    const card = this.cards.find((c) => c.cardId === cardId);
    if (!card) return;

    this.setState(cardId, CardState.FACE_UP);
    this.flipped.push(cardId);

    if (this.flipped.length === MAX_FLIP_COUNT_PER_TURN) {
      this.checkMatch(this.flipped[0], this.flipped[1]);
    }
  }

  reset(): void {
    this.clearTimers();
    this.cards = [];
    this.stateByCardId.clear();
    this.flipped = [];
  }

  private checkMatch(cardAId: string, cardBId: string): void {
    const a = this.cards.find((c) => c.cardId === cardAId);
    const b = this.cards.find((c) => c.cardId === cardBId);
    if (!a || !b) {
      this.flipped = [];
      return;
    }

    if (a.pairId === b.pairId) {
      this.handleMatch(cardAId, cardBId, a.pairId);
      return;
    }

    this.handleMismatch(cardAId, cardBId);
  }

  private handleMatch(cardAId: string, cardBId: string, pairId: string): void {
    this.setState(cardAId, CardState.MATCHED);
    this.setState(cardBId, CardState.MATCHED);
    this.flipped = [];

    const payload: ICardMatchedEvent = { cardAId, cardBId, pairId };
    director.emit(ON_CARD_MATCHED, payload);
    Logger.info('[CardManager]', 'matched', payload);
  }

  private handleMismatch(cardAId: string, cardBId: string): void {
    this.setState(cardAId, CardState.LOCKED);
    this.setState(cardBId, CardState.LOCKED);

    const payload: ICardMismatchEvent = { cardAId, cardBId };
    director.emit(ON_CARD_MISMATCH, payload);

    this.mismatchTimerId = setTimeout(() => {
      this.mismatchTimerId = null;
      this.setState(cardAId, CardState.FACE_DOWN);
      this.setState(cardBId, CardState.FACE_DOWN);
      this.flipped = [];
    }, FLIP_DELAY_MS);
  }

  private setState(cardId: string, state: CardState): void {
    this.stateByCardId.set(cardId, state);
    director.emit(ON_CARD_STATE_CHANGED, { cardId, state });
  }

  private clearTimers(): void {
    if (this.mismatchTimerId) {
      clearTimeout(this.mismatchTimerId);
      this.mismatchTimerId = null;
    }
  }

  private shuffle<T>(input: T[]): T[] {
    const a = input.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
}

