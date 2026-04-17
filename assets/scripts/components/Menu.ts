import { _decorator, Component, director, EventTouch, Label, Node, tween, Tween, Vec3 } from 'cc';
import { apiGameInfo, apiPlay } from '../dataDemo';
import { GameManager } from '../managers/GameManager';
const { ccclass, property } = _decorator;

@ccclass('Menu')
export class Menu extends Component {

    @property({ type: Label, tooltip: 'Mô tả về game' })
    private labelDesc: Label = null!;

    @property({ type: Node, tooltip: 'Icon load màn' })
    loadingIcon: Node = null!;

    protected onLoad(): void {
        this.labelDesc.string = apiGameInfo.description;
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.loadingIcon);
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

        director.preloadScene("Game", () => { }, () => {
            GameManager.instance.levelConfig = apiPlay;

            this.scheduleOnce(() => {
                director.loadScene("Game");
            }, 0.3);
        });
    }

    onTapBXH() {

    }
}


