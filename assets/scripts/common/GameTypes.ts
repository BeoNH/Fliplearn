export enum GameState {
    IDLE = 'IDLE',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    RESULT = 'RESULT',
}

export enum CardState {
    FACE_DOWN = 'FACE_DOWN',
    FACE_UP = 'FACE_UP',
    MATCHED = 'MATCHED',
    LOCKED = 'LOCKED',
}

export enum CardType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    DEFINITION = 'DEFINITION',
}

export interface ICardInfo {
    cardId: string;
    pairId: string;
    type: CardType;
    content: string;
    image: string;
}

export interface ILevelConfig {
    levelId: number;
    hasTimeLimit: boolean;
    timeLimit: number;
    rows: number;
    cols: number;
    pairs: {
        cardA: ICardInfo;
        cardB: ICardInfo;
    }[];
}

export interface IGameSession {
    sessionId: string;
    config: ILevelConfig[];
    currentLevel: number;
    totalScore: number;
    totalTimeSec: number;
    startTimeMs: number;
}

export interface ILevelInitEvent {
    cards: ICardInfo[];
    rows: number;
    cols: number;
}

export interface IScoreState {
  matchedPairs: number;
  totalPairs: number;
//   moves: number;
}


