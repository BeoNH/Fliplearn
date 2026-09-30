import { _decorator, instantiate, Label, Prefab } from 'cc';
import Popup from '../../common/Popup';
import AssetLoader from '../../services/AssetLoader';
import { TimerManager } from '../../managers/TimerManager';
import { GameManager } from '../../managers/GameManager';
import { UILabel } from '../../utils/UILabel';

const { ccclass, property } = _decorator;

@ccclass('PopupIntroduc')
export class PopupIntroduc extends Popup {
    public static async show() {
        let prefab = await AssetLoader.loadResAsync<Prefab>("prefabs/popupIntroduc", Prefab);
        if (!prefab) return;
        let node = instantiate(prefab);
        node.getComponent(PopupIntroduc).show();
    }

    async show() {
        await super.show();
        TimerManager.instance.stop();
    }

    @property({ type: Label, tooltip: 'Hiển thị nội dung' })
    private viewLabel: Label = null!;

    protected onAfterShow(): void {
        this.viewLabel.string = GameManager.instance.GameInfo.introduction;

        const uiLabel = this.viewLabel.getComponent(UILabel);
        if (uiLabel) {
            uiLabel.text = this.viewLabel.string;
        }
    }

    protected onAfterHide(): void {
        TimerManager.instance.resum();
    }

}


