import { director } from 'cc';
import {
  ON_REQUEST_START_SESSION,
  ON_REQUEST_TOPICS,
  ON_TOPIC_SELECTED,
  ON_TOPICS_UPDATED,
} from '../data/GameEvents';
import type { IGameConfig, IRequestStartSessionEvent, ITopic, ITopicSelectedEvent, ITopicsUpdatedEvent } from '../data/GameTypes';
import { NetworkManager } from './NetworkManager';
import { Logger } from '../utils/Logger';

export class TopicManager {
  private static _instance: TopicManager | null = null;

  static get instance(): TopicManager {
    if (!TopicManager._instance) {
      TopicManager._instance = new TopicManager();
    }
    return TopicManager._instance;
  }

  private topics: ITopic[] = [];
  private selectedTopicId: string | null = null;

  private constructor() {}

  init(): void {
    director.on(ON_REQUEST_TOPICS, this.onRequestTopics, this);
    director.on(ON_TOPIC_SELECTED, this.onTopicSelected, this);
  }

  destroy(): void {
    director.off(ON_REQUEST_TOPICS, this.onRequestTopics, this);
    director.off(ON_TOPIC_SELECTED, this.onTopicSelected, this);
  }

  getTopics(): readonly ITopic[] {
    return this.topics;
  }

  getSelectedTopicId(): string | null {
    return this.selectedTopicId;
  }

  private async onRequestTopics(): Promise<void> {
    try {
      const topics = await NetworkManager.instance.getTopics();
      this.topics = topics;
      const payload: ITopicsUpdatedEvent = { topics, error: null };
      director.emit(ON_TOPICS_UPDATED, payload);
    } catch (e) {
      Logger.error('[TopicManager]', 'getTopics failed', e);
      const payload: ITopicsUpdatedEvent = { topics: [], error: this.errorToString(e) };
      director.emit(ON_TOPICS_UPDATED, payload);
    }
  }

  private onTopicSelected(evt: ITopicSelectedEvent): void {
    this.selectedTopicId = evt.topicId;
    const topic = this.topics.find((t) => t.topicId === evt.topicId) ?? null;
    if (!topic) {
      Logger.warn('[TopicManager]', 'topic not found', evt.topicId);
      return;
    }

    const config: IGameConfig = {
      levels: topic.levels,
      hasTimeLimit: false,
      timeLimitSeconds: null,
    };

    const payload: IRequestStartSessionEvent = { config, topicId: topic.topicId };
    director.emit(ON_REQUEST_START_SESSION, payload);
  }

  private errorToString(e: unknown): string {
    if (e instanceof Error) return e.message;
    try {
      return JSON.stringify(e);
    } catch {
      return String(e);
    }
  }
}

