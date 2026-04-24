import { _decorator, Component, director, instantiate, Node, Prefab, UITransform } from 'cc';
import BroadcastReceiver from '../common/BroadcastReceiver';
import { ON_LEVEL_INIT } from '../common/GameEvents';
import { ICardInfo, ILevelInitEvent } from '../common/GameTypes';
import { Logger } from '../utils/Logger';
import { GameManager } from '../managers/GameManager';
import { CardView } from './CardView';
const { ccclass, property } = _decorator;

@ccclass('GameBootstrap')
export class GameBootstrap extends Component {

    @property({ type: Node, tooltip: 'Danh sách THẺ BÀI trong scene' })
    public cardGrid: Node = null!;
    @property({ type: Prefab, tooltip: 'Thẻ bài' })
    public cardPrefab: Prefab = null!;

    protected onLoad(): void {
        BroadcastReceiver.register(ON_LEVEL_INIT, this.initializeGrid.bind(this), this);

        director.preloadScene("Menu");
        GameManager.instance.initSession();
    }

    protected onDestroy(): void {
        BroadcastReceiver.unRegisterByTarget(this);
    }


    private initializeGrid(evt: ILevelInitEvent) {
        const { cards, rows, cols } = evt;
        this.cardGrid.removeAllChildren();

        const bg = this.cardPrefab.data.getChildByPath('Back');
        const ui = bg?.getComponent(UITransform);
        const baseW = ui?.contentSize.width ?? 200;
        const baseH = ui?.contentSize.height ?? 200;

        const spacingX = 10, spacingY = 20;

        const scale = Math.max(cols > 3 ? 3 / cols : 1, 0.5);
        const w = baseW * scale;
        const h = baseH * scale;

        const totalW = cols * w + (cols - 1) * spacingX;
        const totalH = rows * h + (rows - 1) * spacingY;

        this.cardGrid.getComponent(UITransform)!
            .setContentSize(
                totalW + 30 * 2,
                totalH + 30 * 2
            );

        const startX = -totalW / 2 + w / 2;
        const startY = totalH / 2 - h / 2;

        cards.forEach((info, i) => {
            const card = instantiate(this.cardPrefab);
            const row = Math.floor(i / cols);
            const col = i % cols;

            card.setParent(this.cardGrid);
            card.setPosition(
                startX + col * (w + spacingX),
                startY - row * (h + spacingY),
                0
            );
            card.setScale(scale, scale, 1);

            card.getComponent(CardView)?.init(info);
        });
    }
}


