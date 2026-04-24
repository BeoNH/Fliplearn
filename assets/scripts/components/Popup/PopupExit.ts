import { _decorator, Component, director, instantiate, Node, Prefab } from 'cc';
import AssetLoader from '../../services/AssetLoader';
import Popup from '../../common/Popup';
import { TimerManager } from '../../managers/TimerManager';

const { ccclass, property } = _decorator;

@ccclass('PopupExit')
export class PopupExit extends Popup {
    public static async show() {
        let prefab = await AssetLoader.loadResAsync<Prefab>("prefabs/popupExit", Prefab);
        if (!prefab) return;
        let node = instantiate(prefab);
        node.getComponent(PopupExit).show();
    }

    show() {
        super.show();
        TimerManager.instance.stop();
    }

    protected onAfterHide(): void {
        TimerManager.instance.resum();
    }

    onTapExit(){
        director.loadScene("Menu");
    }
}


