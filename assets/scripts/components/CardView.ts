import { _decorator, Button, Component, Node, director } from 'cc';
import { ON_CARD_FLIP, ON_CARD_STATE_CHANGED } from '../data/GameEvents';
import { CardState, type ICardData } from '../data/GameTypes';
import { Logger } from '../utils/Logger';

const { ccclass, property } = _decorator;

interface ICardStateChangedEvent {
  cardId: string;
  state: CardState;
}

@ccclass('CardView')
export class CardView extends Component {
  @property({ type: Node, tooltip: 'Mặt trước thẻ' })
  private frontFace: Node = null!;

  @property({ type: Node, tooltip: 'Mặt sau thẻ' })
  private backFace: Node = null!;

  @property({ type: Button, tooltip: 'Nút lật thẻ' })
  private flipBtn: Button = null!;

  private cardData: ICardData | null = null;
  private state: CardState = CardState.FACE_DOWN;

  onLoad(): void {
    this.flipBtn.node.on(Button.EventType.CLICK, this.onFlipTap, this);
    director.on(ON_CARD_STATE_CHANGED, this.onCardStateChanged, this);
  }

  onDestroy(): void {
    this.flipBtn.node.off(Button.EventType.CLICK, this.onFlipTap, this);
    director.off(ON_CARD_STATE_CHANGED, this.onCardStateChanged, this);
  }

  init(data: ICardData): void {
    this.cardData = data;
    this.applyState(CardState.FACE_DOWN);
  }

  private onFlipTap(): void {
    if (!this.cardData) return;
    if (this.state !== CardState.FACE_DOWN) return;
    Logger.info('[CardView]', 'tap', this.cardData.cardId);
    director.emit(ON_CARD_FLIP, { cardId: this.cardData.cardId });
  }

  private onCardStateChanged(evt: ICardStateChangedEvent): void {
    if (!this.cardData) return;
    if (evt.cardId !== this.cardData.cardId) return;
    this.applyState(evt.state);
  }

  private applyState(state: CardState): void {
    this.state = state;
    const faceUp = state === CardState.FACE_UP || state === CardState.MATCHED || state === CardState.LOCKED;
    this.frontFace.active = faceUp;
    this.backFace.active = !faceUp;
    this.flipBtn.interactable = state === CardState.FACE_DOWN;
  }
}

