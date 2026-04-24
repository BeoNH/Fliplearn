import BroadcastReceiver from "../common/BroadcastReceiver";
import { ON_CARD_MATCHED, ON_CARD_STATE_CHANGED } from "../common/GameEvents";
import { CardState, ICardInfo, ILevelConfig } from "../common/GameTypes";
import { Logger } from "../utils/Logger";
import { GameManager } from "./GameManager";
import { ScoreManager } from "./ScoreManager";

export class CardManager {
    private static _instance: CardManager | null = null;

    static get instance(): CardManager {
        if (!CardManager._instance) {
            CardManager._instance = new CardManager();
        }
        return CardManager._instance;
    }
    private constructor() { }

    private cards: ICardInfo[] = [];
    private stateByCardId: Map<string, CardState> = new Map();
    private flipped: string[] = [];
    private mismatchTimerId: ReturnType<typeof setTimeout> | null = null;

    reset(): void {
        this.clearTimers();
        this.cards = [];
        this.stateByCardId.clear();
        this.flipped = [];
    }

    initListCard(level: ILevelConfig): ICardInfo[] {
        this.clearTimers();
        this.flipped = [];

        const cards: ICardInfo[] = [];
        for (const pair of level.pairs) {
            cards.push(pair.cardA, pair.cardB);
        }
        this.cards = this.shuffle(cards);
        this.stateByCardId = new Map(this.cards.map((c) => [c.cardId, CardState.FACE_DOWN]));
        Logger.info('[CardManager]', 'initLevel', level.levelId, 'cards', this.cards.length);
        return this.cards;
    }

    flipCard(cardId: string): void {
        if (this.mismatchTimerId) return;
        if (this.flipped.length >= 2) return;

        const state = this.stateByCardId.get(cardId) ?? CardState.FACE_DOWN;
        if (state !== CardState.FACE_DOWN) return;

        const card = this.cards.find((c) => c.cardId === cardId);
        if (!card) return;

        this.setState(cardId, CardState.FACE_UP);
        this.flipped.push(cardId);

        if (this.flipped.length === 2) {
            this.checkMatch(this.flipped[0], this.flipped[1]);
        }
    }

    private setState(cardId: string, state: CardState): void {
        this.stateByCardId.set(cardId, state);
        BroadcastReceiver.send(ON_CARD_STATE_CHANGED, { cardId, state });
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

        ScoreManager.instance.recordMatchedPair();
        BroadcastReceiver.send(ON_CARD_MATCHED);
        GameManager.instance.checkLevelComplete();
        
        const payload = { cardAId, cardBId, pairId };
        Logger.info('[CardManager]', 'matched', payload);
    }

    private handleMismatch(cardAId: string, cardBId: string): void {
        this.setState(cardAId, CardState.LOCKED);
        this.setState(cardBId, CardState.LOCKED);

        this.mismatchTimerId = setTimeout(() => {
            this.mismatchTimerId = null;
            this.setState(cardAId, CardState.FACE_DOWN);
            this.setState(cardBId, CardState.FACE_DOWN);
            this.flipped = [];
        }, 1.3 * 1000);
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


