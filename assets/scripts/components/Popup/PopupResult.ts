import { _decorator, director, instantiate, Label, Prefab } from 'cc';
import Popup from '../../common/Popup';
import AssetLoader from '../../services/AssetLoader';
import { NumberScrolling } from '../../common/NumberScrolling';
import { GameManager } from '../../managers/GameManager';
import { PopupBXH } from './PopupBXH';
import { LayerText } from '../LayerText';
import { i18n } from '../../i18n/LocalizationManager';

const { ccclass, property } = _decorator;

@ccclass('PopupResult')
export class PopupResult extends Popup {
    public static async show() {
        let prefab = await AssetLoader.loadResAsync<Prefab>("prefabs/popupResult", Prefab);
        if (!prefab) return;
        let node = instantiate(prefab);
        node.getComponent(PopupResult).show();
    }

    show() {
        super.show();
    }

    @property({ type: LayerText, tooltip: 'Hiển thị tên kết quả' })
    private titleLabel: LayerText = null!;

    @property({ type: NumberScrolling, tooltip: 'Hiển thị điểm' })
    private scoreLabel: NumberScrolling = null!;

    @property({ type: Label, tooltip: 'Hiển thị thời gian chơi' })
    private timeLabel: Label = null!;

    protected onAfterShow(): void {
        this.titleLabel.setText(i18n.t("result.title"));

        const { score, time } = GameManager.instance.getGameStats();
        this.scoreLabel.setValue(0);
        this.scoreLabel.to(score);
        this.timeLabel.string = `${this.formatTime(time)}`;

        // try {
        //     const res = await NetworkManager.instance.saveScore({
        //         score: finalScore,
        //         time: timeUsedSeconds,
        //         topicId,
        //     });
        //     isNewBestScore = res.newBestScore;
        //     currentBest = res.currentBest;
        //     Logger.info('[GameManager]', 'saveScore success', res);
        // } catch (error) {
        //     Logger.warn('[GameManager]', 'saveScore failed', error);
        // }
    }

    onTapExit(){
        director.loadScene("Menu");
    }

    onTapBXH() {
        PopupBXH.show();
    }

    private formatTime(secondsRaw: number): string {
        const seconds = Math.max(0, Math.floor(secondsRaw));
        const m = this.pad2(Math.floor(seconds / 60));
        const s = this.pad2(seconds % 60);
        return `${m}:${s}`;
    }

    private pad2(n: number): string {
        const v = Math.max(0, Math.floor(n));
        return v < 10 ? `0${v}` : `${v}`;
    }
}


