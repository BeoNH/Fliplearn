import { _decorator, Button, Component, Label, Node, Sprite, tween, Tween, UIOpacity, UISkew, v2, Vec3 } from 'cc';
import { CardState, CardType, ICardInfo } from '../common/GameTypes';
import BroadcastReceiver from '../common/BroadcastReceiver';
import { Logger } from '../utils/Logger';
import { ON_CARD_STATE_CHANGED } from '../common/GameEvents';
import { CardManager } from '../managers/CardManager';
import AssetLoader from '../services/AssetLoader';

const { ccclass, property } = _decorator;

type AnimState = 'idle' | 'flipping' | 'shaking' | 'bouncing';

@ccclass('CardView')
export class CardView extends Component {
    @property({ type: Node, tooltip: 'Mặt sau thẻ' })
    private backFace: Node = null!;

    @property({ type: Node, tooltip: 'Mặt trước thẻ' })
    private frontFace: Node = null!;

    @property({ type: Node, tooltip: 'Viền khi đúng' })
    private borderCorrect: Node = null!;

    @property({ type: Node, tooltip: 'Viền khi sai' })
    private borderWrong: Node = null!;

    @property({ tooltip: 'Góc skew tối đa (độ). 0 = tắt.', range: [0, 30, 1], slide: true })
    private maxSkewDeg: number = 15;

    @property({ tooltip: 'Tổng thời gian lật (giây)' })
    private duration: number = 0.35;

    @property({ type: Button, tooltip: 'Nút lật thẻ' })
    private flipBtn: Button = null!;

    @property({ type: Sprite, tooltip: 'Ảnh thẻ' })
    private image: Sprite = null!;

    @property({ type: Label, tooltip: 'Tên thẻ' })
    private content: Label = null!;

    // ─── Internal state ───────────────────────────────────────────────────────

    private cardInfo: ICardInfo | null = null;
    private state: CardState = CardState.FACE_DOWN;
    private scaleClone: Vec3 = Vec3.ONE;
    private uiSkew: UISkew = null!;


    // ─── Lifecycle ────────────────────────────────────────────────────────────

    protected onLoad(): void {
        this.uiSkew = this.node.getComponent(UISkew) ?? this.node.addComponent(UISkew);
        this.uiSkew.setSkew(0, 0);

        BroadcastReceiver.register(ON_CARD_STATE_CHANGED, this.onCardStateChanged.bind(this), this);
    }

    protected onDestroy(): void {
        BroadcastReceiver.unRegisterByTarget(this);
    }

    init(data: ICardInfo): void {
        this.cardInfo = data;
        this.scaleClone = this.node.scale.clone();
        this.applyState(CardState.FACE_DOWN);
        this.setCardData();
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
                    })
                this.content.node.active = true;
                this.content.string = this.cardInfo.content;
                break;
        }
    }

    protected onFlipTap(): void {
        if (!this.cardInfo || this.state !== CardState.FACE_DOWN) return;
        Logger.info('[Card]', 'tap', this.cardInfo.cardId);
        CardManager.instance.flipCard(this.cardInfo.cardId);
    }

    private onCardStateChanged(data: { cardId: string; state: CardState }) {
        if (!this.cardInfo || data.cardId !== this.cardInfo.cardId) return;
        this.applyState(data.state);
    }

    private applyState(state: CardState): void {

        this.state = state;
        this.flipBtn.interactable = state === CardState.FACE_DOWN;
        this.borderCorrect.active = false;
        this.borderWrong.active = false;

        switch (state) {
            case CardState.FACE_UP:
                this.flip(true);
                break;
            case CardState.FACE_DOWN:
                this.flip(false);
                break;
            case CardState.MATCHED:
                this.borderCorrect.active = true;
                this.correctEffect();
                break;
            case CardState.LOCKED:
                this.borderWrong.active = true;
                this.wrongEffect();
                break;
        }

    }

    private isFlipping: boolean = false;
    private _flipped: boolean = false;

    private flip(toFaceUp: boolean, onDone?: (() => void) | null): void {
        if (this.isFlipping) return;
        this.isFlipping = true;

        this._flipped = false;

        Tween.stopAllByTarget(this.node);
        this.uiSkew.setSkew(0, 0);

        tween(this.node)
            .to(this.duration, {}, {
                easing: 'linear',
                onUpdate: (_, ratio) => this._tick(ratio, toFaceUp),
            })
            .call(() => {
                this.node.setScale(this.scaleClone);
                this.uiSkew.setSkew(0, 0);
                this.isFlipping = false;

                onDone?.();
            })
            .start();
    }

    private _tick(raw: number, toFaceUp: boolean): void {
        const progress = CardView._easeInOut(raw);
        const angle = progress * Math.PI;

        // Scale theo trục X: cos → 1 → 0 → 1
        const x = Math.abs(Math.cos(angle));
        const skewDeg = Math.sin(angle) * this.maxSkewDeg;

        const scale = new Vec3(x, 1, 1);
        Vec3.multiply(scale, scale, this.scaleClone);
        this.node.setScale(scale);
        this.uiSkew.setSkew(0, skewDeg);

        // Đổi mặt đúng lúc scale ≈ 0
        if (!this._flipped && raw >= 0.5) {
            this._flipped = true;
            this.frontFace.active = toFaceUp;
            this.backFace.active = !toFaceUp;
        }
    }

    private static _easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Hiệu ứng ĐÚNG:
     *  • Scale nảy lên nhẹ (1 → 1.12 → 0.96 → 1)
     *  • Viền xanh lá nhấp nháy rồi mờ dần
     */
    private correctEffect(): void {

        tween(this.node)
            .delay(this.duration)
            .to(0.10, {
                scale: new Vec3(
                    1.12 * this.scaleClone.x,
                    1.12 * this.scaleClone.y,
                    1 * this.scaleClone.z
                )
            }, { easing: 'sineOut' })
            .to(0.08, {
                scale: new Vec3(
                    0.96 * this.scaleClone.x,
                    0.96 * this.scaleClone.y,
                    1 * this.scaleClone.z
                )
            }, { easing: 'sineIn' })
            .to(0.08, {
                scale: new Vec3(
                    1.0 * this.scaleClone.x,
                    1.0 * this.scaleClone.y,
                    1 * this.scaleClone.z
                )
            }, { easing: 'sineOut' })
            .start();

        // Border flash
        this._flashBorder(this.borderCorrect);
    }

    /**
     * Hiệu ứng SAI:
     *  • Rung ngang (shake)
     *  • Viền đỏ nhấp nháy 2 lần rồi mờ dần
     */
    private wrongEffect(): void {
        const origin = this.node.position.clone();
        const S = 9; // biên độ rung (px)

        tween(this.node)
            .delay(this.duration)
            .to(0.05, { position: new Vec3(origin.x - S, origin.y, origin.z) })
            .to(0.05, { position: new Vec3(origin.x + S, origin.y, origin.z) })
            .to(0.05, { position: new Vec3(origin.x - S * 0.7, origin.y, origin.z) })
            .to(0.05, { position: new Vec3(origin.x + S * 0.7, origin.y, origin.z) })
            .to(0.05, { position: new Vec3(origin.x - S * 0.4, origin.y, origin.z) })
            .to(0.05, { position: new Vec3(origin.x + S * 0.4, origin.y, origin.z) })
            .to(0.04, { position: origin })
            .start();

        // Border flash
        this._flashBorder(this.borderWrong);
    }

    /**
     * Flash: bật sáng → mờ dần × 2 lần rồi ẩn hẳn.
     * Tween trên UIOpacity của border node, không ảnh hưởng node chính.
     */
    private _flashBorder(border: Node): void {
        if (!border) return;

        const opacity = border.getComponent(UIOpacity) ?? border.addComponent(UIOpacity);
        opacity.opacity = 0;

        Tween.stopAllByTarget(border);
        tween(opacity)
            .to(0.08, { opacity: 255 })
            .to(0.12, { opacity: 60 })
            .to(0.08, { opacity: 255 })
            .to(0.20, { opacity: 0 })
            .to(0.10, { opacity: 255 })
            // .call(() => { border.active = false; })
            .start();
    }

}


