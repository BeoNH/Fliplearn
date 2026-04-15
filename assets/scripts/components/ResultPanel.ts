import { _decorator, Button, Component, Label, director } from 'cc';
import { ON_GAME_COMPLETE, ON_OPEN_LEADERBOARD, ON_PLAY_AGAIN } from '../data/GameEvents';
import type { IGameCompleteEvent } from '../data/GameTypes';
import { ScreenName, UIManager } from '../managers/UIManager';

const { ccclass, property } = _decorator;

@ccclass('ResultPanel')
export class ResultPanel extends Component {
  @property({ type: Label, tooltip: 'Điểm cuối cùng' })
  private scoreLabel: Label = null!;

  @property({ type: Label, tooltip: 'Thời gian sử dụng' })
  private timeLabel: Label = null!;

  @property({ type: Button, tooltip: 'Chơi lại' })
  private playAgainBtn: Button = null!;

  @property({ type: Button, tooltip: 'Bảng xếp hạng' })
  private leaderboardBtn: Button = null!;

  onLoad(): void {
    director.on(ON_GAME_COMPLETE, this.onGameComplete, this);
    this.playAgainBtn.node.on(Button.EventType.CLICK, this.onPlayAgainTap, this);
    this.leaderboardBtn.node.on(Button.EventType.CLICK, this.onLeaderboardTap, this);
    this.node.active = false;
  }

  onDestroy(): void {
    director.off(ON_GAME_COMPLETE, this.onGameComplete, this);
    this.playAgainBtn.node.off(Button.EventType.CLICK, this.onPlayAgainTap, this);
    this.leaderboardBtn.node.off(Button.EventType.CLICK, this.onLeaderboardTap, this);
  }

  private onGameComplete(data: IGameCompleteEvent): void {
    this.scoreLabel.string = `${data.finalScore}`;
    this.timeLabel.string = `${data.timeUsedSeconds}s`;
    UIManager.instance.hideAll();
    UIManager.instance.showScreen(ScreenName.RESULT);
  }

  private onPlayAgainTap(): void {
    director.emit(ON_PLAY_AGAIN);
  }

  private onLeaderboardTap(): void {
    director.emit(ON_OPEN_LEADERBOARD);
  }
}

