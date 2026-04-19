import { _decorator, Button, Component, Label, Node, Sprite } from 'cc';
import { CardState, CardType, ICardInfo } from '../common/GameTypes';
import BroadcastReceiver from '../common/BroadcastReceiver';
import { Logger } from '../utils/Logger';
import { ON_CARD_STATE_CHANGED } from '../common/GameEvents';
import { CardManager } from '../managers/CardManager';
import { AssetLoader } from '../services/AssetLoader';
const { ccclass, property } = _decorator;

@ccclass('CardView')
export class CardView extends Component {
    @property({ type: Node, tooltip: 'Mặt sau thẻ' })
    public backFace: Node = null!;

    @property({ type: Node, tooltip: 'Mặt trước thẻ' })
    public frontFace: Node = null!;

    @property({ type: Button, tooltip: 'Nút lật thẻ' })
    public flipBtn: Button = null!;

    @property({ type: Sprite, tooltip: 'Ảnh thẻ' })
    public image: Sprite = null!;

    @property({ type: Label, tooltip: 'Tên thẻ' })
    public content: Label = null!;

    private cardInfo: ICardInfo | null = null;
    private state: CardState = CardState.FACE_DOWN;

    protected onLoad(): void {
        BroadcastReceiver.register(ON_CARD_STATE_CHANGED, this.onCardStateChanged.bind(this), this);
    }

    protected onDestroy(): void {
        BroadcastReceiver.unRegisterByTarget(this);
    }

    init(data: ICardInfo): void {
        this.cardInfo = data;
        this.applyState(CardState.FACE_DOWN);
        this.setCardData();
    }

    protected onFlipTap(): void {
        if (!this.cardInfo) return;
        if (this.state !== CardState.FACE_DOWN) return;
        Logger.info('[Card]', 'tap', this.cardInfo.cardId);
        CardManager.instance.flipCard(this.cardInfo.cardId);
    }

    private onCardStateChanged(data: { cardId: string; state: CardState }) {
        if (!this.cardInfo) return;
        if (data.cardId !== this.cardInfo.cardId) return;
        this.applyState(data.state);
    }

    private applyState(state: CardState): void {
        this.state = state;
        const faceUp = state === CardState.FACE_UP || state === CardState.MATCHED || state === CardState.LOCKED;
        this.frontFace.active = faceUp;
        this.backFace.active = !faceUp;
        this.flipBtn.interactable = state === CardState.FACE_DOWN;
    }

    private setCardData() {
        if (!this.cardInfo) return;
        this.image.node.active = false;
        this.content.node.active = false;

        switch (this.cardInfo.type) {
            case CardType.IMAGE:
                AssetLoader.loadSpriteFrame(this.cardInfo.image)
                    .then(sf => {
                        this.image.spriteFrame = sf;
                        this.image.node.active = true;
                    })
                break;
            case CardType.TEXT:
                this.content.string = this.cardInfo.content;
                this.content.node.active = true;
                break;
            case CardType.DEFINITION:
                AssetLoader.loadSpriteFrame(this.cardInfo.image)
                    .then(sf => {
                        this.image.spriteFrame = sf;
                        this.image.node.active = true;
                        this.content.node.active = true;
                    })
                    this.content.string = this.cardInfo.content;
                break;
        }
    }

}


