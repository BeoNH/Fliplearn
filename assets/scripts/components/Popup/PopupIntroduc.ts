import { _decorator, instantiate, Prefab } from 'cc';
import Popup from '../../common/Popup';
import AssetLoader from '../../services/AssetLoader';
import { TimerManager } from '../../managers/TimerManager';

const { ccclass, property } = _decorator;

@ccclass('PopupIntroduc')
export class PopupIntroduc extends Popup {
    public static async show() {
        let prefab = await AssetLoader.loadResAsync<Prefab>("prefabs/popupIntroduc", Prefab);
        if (!prefab) return;
        let node = instantiate(prefab);
        node.getComponent(PopupIntroduc).show();
    }

    show() {
        super.show();
        TimerManager.instance.stop();
    }

    protected onAfterHide(): void {
        TimerManager.instance.resum();
    }

}


