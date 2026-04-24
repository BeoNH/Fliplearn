import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import AssetLoader from '../../services/AssetLoader';
import Popup from '../../common/Popup';
import { NumberScrolling } from '../../common/NumberScrolling';
import { GameManager } from '../../managers/GameManager';

const { ccclass, property } = _decorator;

@ccclass('PopupDoneLevel')
export class PopupDoneLevel extends Popup {

    private resolve: Function = null;

    public static async show(): Promise<'next' | 'stop'> {
        let prefab = await AssetLoader.loadResAsync<Prefab>("prefabs/popupDoneLevel", Prefab);
        if (!prefab) return;
        let node = instantiate(prefab);
        setTimeout(() => {
            node.getComponent(PopupDoneLevel).show();
        }, 1000);

        return new Promise((resolve) => {
            node.getComponent(PopupDoneLevel).resolve = resolve;
        });
    }

    show() {
        super.show();
    }

    @property({ type: NumberScrolling, tooltip: 'Hiển thị điểm' })
    private scoreLabel: NumberScrolling = null!;

    protected onAfterShow(): void {
        const { score } = GameManager.instance.getGameStats();
        this.scoreLabel.setValue(0);
        this.scoreLabel.to(score);
    }

    onTapNextLevel() {
        this.resolve?.('next');
        super.hide();
    }

    onTapStop() {
        this.resolve?.('stop');
        super.hide();
    }
}


