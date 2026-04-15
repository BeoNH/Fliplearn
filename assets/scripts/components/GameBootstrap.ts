import { _decorator, Component, Node, director } from 'cc';
import { ON_LEVEL_INIT, ON_OPEN_LEADERBOARD, ON_PLAY_AGAIN } from '../data/GameEvents';
import { CardType, type IGameConfig, type ILevelInitEvent } from '../data/GameTypes';
import { GameManager } from '../managers/GameManager';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { TimerManager } from '../managers/TimerManager';
import { TopicManager } from '../managers/TopicManager';
import { ScreenName, UIManager } from '../managers/UIManager';
import { CardView } from './CardView';
import { GameHUD } from './GameHUD';

const { ccclass, property } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {
  @property({ type: Node, tooltip: 'Màn hình chơi' })
  private gameScreen: Node = null!;

  @property({ type: Node, tooltip: 'Màn hình kết quả' })
  private resultScreen: Node = null!;

  @property({ type: Node, tooltip: 'Màn hình topic list (optional)' })
  private topicListScreen: Node = null!;

  @property({ type: Node, tooltip: 'Màn hình leaderboard (optional)' })
  private leaderboardScreen: Node = null!;

  @property({ type: [CardView], tooltip: 'Danh sách CardView trong scene (đủ số lượng thẻ của level)' })
  private cardViews: CardView[] = [];

  @property({ type: GameHUD, tooltip: 'HUD in-game' })
  private hud: GameHUD = null!;

  private config: IGameConfig = this.makeDefaultConfig();

  onLoad(): void {
    UIManager.instance.registerScreen(ScreenName.GAME, this.gameScreen);
    UIManager.instance.registerScreen(ScreenName.RESULT, this.resultScreen);
    UIManager.instance.registerScreen(ScreenName.TOPIC_LIST, this.topicListScreen);
    UIManager.instance.registerScreen(ScreenName.LEADERBOARD, this.leaderboardScreen);

    UIManager.instance.hideAll();
    UIManager.instance.showScreen(ScreenName.GAME);

    GameManager.instance.init();
    TopicManager.instance.init();
    LeaderboardManager.instance.init();
    director.on(ON_LEVEL_INIT, this.onLevelInit, this);
    director.on(ON_PLAY_AGAIN, this.onPlayAgain, this);
    director.on(ON_OPEN_LEADERBOARD, this.onOpenLeaderboard, this);

    GameManager.instance.startSession(this.config, null);
  }

  onDestroy(): void {
    director.off(ON_LEVEL_INIT, this.onLevelInit, this);
    director.off(ON_PLAY_AGAIN, this.onPlayAgain, this);
    director.off(ON_OPEN_LEADERBOARD, this.onOpenLeaderboard, this);
    TopicManager.instance.destroy();
    LeaderboardManager.instance.destroy();
    GameManager.instance.destroy();
  }

  update(dt: number): void {
    GameManager.instance.update(dt);
    this.hud.updateTimer(TimerManager.instance.getRemainSeconds());
  }

  private onLevelInit(evt: ILevelInitEvent): void {
    const cards = evt.cards;
    for (let i = 0; i < this.cardViews.length; i += 1) {
      const view = this.cardViews[i];
      const card = cards[i];
      if (!view || !card) continue;
      view.init(card);
    }
  }

  private onPlayAgain(): void {
    GameManager.instance.reset();
    UIManager.instance.hideAll();
    UIManager.instance.showScreen(ScreenName.GAME);
    GameManager.instance.startSession(this.config, null);
  }

  private onOpenLeaderboard(): void {
    UIManager.instance.hideAll();
    UIManager.instance.showScreen(ScreenName.LEADERBOARD);
  }

  private makeDefaultConfig(): IGameConfig {
    return {
      hasTimeLimit: true,
      timeLimitSeconds: 60,
      levels: [
        {
          levelIndex: 0,
          cardPairs: [
            {
              pairId: 'p1',
              cardA: { cardId: 'c1a', pairId: 'p1', type: CardType.TEXT, content: 'Hello' },
              cardB: { cardId: 'c1b', pairId: 'p1', type: CardType.TEXT, content: 'Xin chào' },
            },
            {
              pairId: 'p2',
              cardA: { cardId: 'c2a', pairId: 'p2', type: CardType.TEXT, content: 'Cat' },
              cardB: { cardId: 'c2b', pairId: 'p2', type: CardType.TEXT, content: 'Mèo' },
            },
          ],
        },
      ],
    };
  }
}

