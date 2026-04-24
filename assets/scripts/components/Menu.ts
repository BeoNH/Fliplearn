import { _decorator, Component, director, EventTouch, Label, Node, tween, Tween, Vec3 } from 'cc';
import { apiGameInfo, apiPlay } from '../dataDemo';
import { GameManager } from '../managers/GameManager';
import { PopupBXH } from './Popup/PopupBXH';
import { i18n } from '../i18n/LocalizationManager';
import { urlParam } from '../managers/NetworkManager';
import AssetLoader from '../services/AssetLoader';
const { ccclass, property } = _decorator;

@ccclass('Menu')
export class Menu extends Component {

    @property({ type: Label, tooltip: 'Mô tả về game' })
    private labelDesc: Label = null!;

    @property({ type: Node, tooltip: 'Icon load màn' })
    loadingIcon: Node = null!;

    protected onLoad(): void {
        i18n.switchLanguage(urlParam("lang") ?? "vi");

        GameManager.instance.GameInfo = apiGameInfo;
        this.labelDesc.string = apiGameInfo.description;
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.loadingIcon);
    }

    private async preloadLevelAssets() {
        const tasks: Promise<any>[] = [];
    
        for (const level of apiPlay) {
            for (const pair of level.pairs) {
                [pair.cardA, pair.cardB].forEach(card => {
                    if (card.image) {
                        tasks.push(AssetLoader.loadSpriteFrame(card.image));
                    }
                });
            }
        }
    
        await Promise.all(tasks);
    }


    onTapPlay(e: EventTouch) {
        const btn = e.currentTarget as Node;

        btn.active = false;
        this.loadingIcon.active = true;

        tween(this.loadingIcon)
            .repeatForever(
                tween().by(1.5, { eulerAngles: new Vec3(0, 0, -360) })
            )
            .start();

        director.preloadScene("Game", async () => { }, async () => {
            GameManager.instance.levelConfig = apiPlay;
            
            await this.preloadLevelAssets();

            director.loadScene("Game");
        });
    }

    onTapBXH() {
        PopupBXH.show();
    }
}


