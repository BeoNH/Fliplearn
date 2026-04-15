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

export interface ICardData {
  cardId: string;
  pairId: string;
  type: CardType;
  content: string;
}

export interface ICardPair {
  pairId: string;
  cardA: ICardData;
  cardB: ICardData;
}

export interface ILevelConfig {
  levelIndex: number;
  cardPairs: ICardPair[];
}

export interface IGameConfig {
  levels: ILevelConfig[];
  hasTimeLimit: boolean;
  timeLimitSeconds: number | null;
}

export interface IGameSession {
  sessionId: string;
  topicId: string | null;
  config: IGameConfig;
  currentLevel: number;
  startTimeMs: number;
}

export interface ICardFlipEvent {
  cardId: string;
}

export interface ICardMatchedEvent {
  cardAId: string;
  cardBId: string;
  pairId: string;
}

export interface ICardMismatchEvent {
  cardAId: string;
  cardBId: string;
}

export interface ILevelCompleteEvent {
  levelIndex: number;
}

export interface ILevelInitEvent {
  levelIndex: number;
  cards: ICardData[];
}

export interface IGameCompleteEvent {
  finalScore: number;
  timeUsedSeconds: number;
  topicId: string | null;
}

export interface IGameTimeoutEvent {
  remainSeconds: 0;
}

export interface IRequestStartSessionEvent {
  config: IGameConfig;
  topicId: string | null;
}

export interface ITopicSelectedEvent {
  topicId: string;
}

export interface ITopicsUpdatedEvent {
  topics: ITopic[];
  error: string | null;
}

export interface ILeaderboardUpdatedEvent {
  entries: ILeaderboardEntry[];
  error: string | null;
}

export interface ISaveScoreRequest {
  score: number;
  time: number;
  topicId: string;
}

export interface ISaveScoreResponse {
  success: boolean;
  newBestScore: boolean;
  currentBest: number;
}

export interface ILeaderboardEntry {
  rank: number;
  playerName: string;
  totalScore: number;
  totalTime: number;
}

export interface ITopic {
  topicId: string;
  name: string;
  description: string;
  cardPairs: ICardPair[];
  levels: ILevelConfig[];
}

