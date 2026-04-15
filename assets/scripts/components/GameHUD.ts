import { _decorator, Component, Label, director } from 'cc';
import { ON_CARD_MATCHED, ON_GAME_RESET, ON_GAME_START, ON_GAME_TIMEOUT } from '../data/GameEvents';

const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {
  @property({ type: Label, tooltip: 'Hiển thị timer' })
  private timerLabel: Label = null!;

  @property({ type: Label, tooltip: 'Hiển thị số cặp đã match' })
  private matchCountLabel: Label = null!;

  private matchedPairs = 0;

  onLoad(): void {
    director.on(ON_CARD_MATCHED, this.onMatched, this);
    director.on(ON_GAME_TIMEOUT, this.onTimeout, this);
    director.on(ON_GAME_START, this.onResetCounters, this);
    director.on(ON_GAME_RESET, this.onResetCounters, this);
    this.render();
  }

  onDestroy(): void {
    director.off(ON_CARD_MATCHED, this.onMatched, this);
    director.off(ON_GAME_TIMEOUT, this.onTimeout, this);
    director.off(ON_GAME_START, this.onResetCounters, this);
    director.off(ON_GAME_RESET, this.onResetCounters, this);
  }

  updateTimer(remainSeconds: number | null): void {
    this.timerLabel.string = remainSeconds === null ? '--:--' : this.formatTime(remainSeconds);
  }

  private onMatched(): void {
    this.matchedPairs += 1;
    this.render();
  }

  private onTimeout(): void {
    this.timerLabel.string = '00:00';
  }

  private onResetCounters(): void {
    this.matchedPairs = 0;
    this.render();
  }

  private render(): void {
    this.matchCountLabel.string = `${this.matchedPairs}`;
  }

  private formatTime(secondsRaw: number): string {
    const seconds = Math.max(0, Math.floor(secondsRaw));
    const m = this.pad2(Math.floor(seconds / 60));
    const s = this.pad2(seconds % 60);
    return `${m}:${s}`;
  }

  private pad2(n: number): string {
    const v = Math.max(0, Math.floor(n));
    return v < 10 ? `0${v}` : `${v}`;
  }
}

