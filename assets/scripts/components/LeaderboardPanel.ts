import { _decorator, Component, director } from 'cc';
import { ON_LEADERBOARD_UPDATED, ON_REQUEST_LEADERBOARD } from '../data/GameEvents';
import type { ILeaderboardUpdatedEvent } from '../data/GameTypes';

const { ccclass } = _decorator;

@ccclass('LeaderboardPanel')
export class LeaderboardPanel extends Component {
  onLoad(): void {
    director.on(ON_LEADERBOARD_UPDATED, this.onLeaderboardUpdated, this);
    director.emit(ON_REQUEST_LEADERBOARD);
  }

  onDestroy(): void {
    director.off(ON_LEADERBOARD_UPDATED, this.onLeaderboardUpdated, this);
  }

  private onLeaderboardUpdated(evt: ILeaderboardUpdatedEvent): void {
    // TODO: render list khi bạn gắn node.
    void evt;
  }
}

