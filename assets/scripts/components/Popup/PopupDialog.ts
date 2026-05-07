import { _decorator, Component, instantiate, Label, Node, Prefab } from 'cc';
import AssetLoader from '../../services/AssetLoader';
import Popup from '../../common/Popup';
const { ccclass, property } = _decorator;

@ccclass('Dialog')
export class Dialog extends Popup {
    public static async show(message: string) {
        let prefab = await AssetLoader.loadResAsync<Prefab>("prefabs/dialogMessage", Prefab);
        if (!prefab) return;
        let node = instantiate(prefab);
        node.getComponent(Dialog).show(message);
    }
    
    @property({ type: Label, tooltip: 'Hiển thị nội dung' })
    private viewLabel: Label = null!;

    show(message?: string) {
        super.show();
        if (message) this.viewLabel.string = message;
    }
}

