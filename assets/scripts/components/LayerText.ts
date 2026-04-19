import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LayerText')
export class LayerText extends Component {
    private _labels: Label[] = [];

    onLoad() {
        this._labels = this.getComponentsInChildren(Label);
    }

    public setText(text: string) {
        for (const label of this._labels) {
            label.string = text;
        }
    }
}


