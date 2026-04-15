import { _decorator, Component, director } from 'cc';
import { ON_REQUEST_TOPICS, ON_TOPIC_SELECTED, ON_TOPICS_UPDATED } from '../data/GameEvents';
import type { ITopicSelectedEvent, ITopicsUpdatedEvent } from '../data/GameTypes';

const { ccclass } = _decorator;

@ccclass('TopicListPanel')
export class TopicListPanel extends Component {
  onLoad(): void {
    director.on(ON_TOPICS_UPDATED, this.onTopicsUpdated, this);
    director.emit(ON_REQUEST_TOPICS);
  }

  onDestroy(): void {
    director.off(ON_TOPICS_UPDATED, this.onTopicsUpdated, this);
  }

  // Bạn sẽ tự gắn UI list sau; ở đây chỉ giữ API để hook.
  selectTopic(topicId: string): void {
    const payload: ITopicSelectedEvent = { topicId };
    director.emit(ON_TOPIC_SELECTED, payload);
  }

  private onTopicsUpdated(evt: ITopicsUpdatedEvent): void {
    // TODO: render list bằng prefab/item view khi bạn gắn node.
    // Ở scaffold này chỉ giữ event hook.
    void evt;
  }
}

