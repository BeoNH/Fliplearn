import { Node } from 'cc';
import { Logger } from '../utils/Logger';

export enum ScreenName {
  GAME = 'GameScreen',
  RESULT = 'ResultScreen',
  TOPIC_LIST = 'TopicListScreen',
  LEADERBOARD = 'LeaderboardScreen',
}

export class UIManager {
  private static _instance: UIManager | null = null;

  static get instance(): UIManager {
    if (!UIManager._instance) {
      UIManager._instance = new UIManager();
    }
    return UIManager._instance;
  }

  private screens: Map<ScreenName, Node> = new Map();

  private constructor() {}

  registerScreen(name: ScreenName, node: Node): void {
    this.screens.set(name, node);
  }

  showScreen(name: ScreenName): void {
    const node = this.screens.get(name);
    if (!node) {
      Logger.warn('[UIManager]', 'screen not registered', name);
      return;
    }
    node.active = true;
  }

  hideScreen(name: ScreenName): void {
    const node = this.screens.get(name);
    if (!node) return;
    node.active = false;
  }

  hideAll(): void {
    for (const node of this.screens.values()) {
      node.active = false;
    }
  }
}

