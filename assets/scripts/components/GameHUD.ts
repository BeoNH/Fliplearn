import { _decorator, Component, Label, director, Sprite, tween, Node } from 'cc';
import { TimerManager } from '../managers/TimerManager';
import { LayerText } from './LayerText';
import { GameManager } from '../managers/GameManager';
import BroadcastReceiver from '../common/BroadcastReceiver';
import { ON_CARD_MATCHED, ON_LEVEL_INIT } from '../common/GameEvents';
import { ScoreManager } from '../managers/ScoreManager';
import { ILevelInitEvent } from '../common/GameTypes';
import { PopupIntroduc } from './Popup/PopupIntroduc';
import { PopupExit } from './Popup/PopupExit';
import { LocalizedLabel } from '../i18n/LocalizedLabel';

const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {
    @property({ type: LayerText, tooltip: 'Hiển thị Tên game' })
    private titleLabel: LayerText = null!;

    @property({ type: Label, tooltip: 'Hiển thị cấp độ' })
    private levelLabel: Label = null!;

    @property({ type: Node, tooltip: 'Hiển thị timer' })
    private timerNode: Node = null!;

    @property({ type: Label, tooltip: 'Hiển thị timer' })
    private timerLabel: Label = null!;

    @property({ type: LocalizedLabel, tooltip: 'Hiển thị số cặp đã ghép' })
    private matchCountLabel: LocalizedLabel = null!;

    @property({ type: Label, tooltip: 'Hiển thị phần trăm hoàn thành' })
    private percentLabel: Label = null!;

    @property({ type: Sprite, tooltip: 'Thanh tiến trình level' })
    private progressBar: Sprite = null!;

    private progressTween: any = null;

    onLoad(): void {
        BroadcastReceiver.register(ON_LEVEL_INIT, this.render.bind(this), this);
        BroadcastReceiver.register(ON_CARD_MATCHED, this.onMatched.bind(this), this);
    }

    onDestroy(): void {
        BroadcastReceiver.unRegisterByTarget(this);
    }

    protected update(dt: number): void {
        TimerManager.instance.update(dt);
        if (this.timerNode && !this.timerNode.active) return;
        const remainSeconds = TimerManager.instance.getRemainSeconds();
        this.timerLabel.string = remainSeconds === null ? '--:--' : this.formatTime(remainSeconds);
    }

    private render(evt: ILevelInitEvent): void {
        const { level } = evt;
        this.titleLabel.setText(GameManager.instance.GameInfo.title);
        this.levelLabel.string = `Level ${level.levelId}`;
        this.timerNode.active = level.hasTimeLimit;
        this.onMatched();
    }

    private onMatched(): void {
        const { matchedPairs, totalPairs } = ScoreManager.instance.getStatePair();

        if (totalPairs <= 0) return;

        const progress = matchedPairs / totalPairs;

        this.matchCountLabel.setParams(`${matchedPairs}/${totalPairs}`)
        this.percentLabel.string = `${Math.floor(progress * 100)}%`

        this.progressTween?.stop();
        this.progressTween = tween(this.progressBar)
            .to(0.35, { fillRange: progress }, { easing: 'quadOut' })
            .start();
    }

    onTapIntroduc() {
        PopupIntroduc.show();
    }

    onTapExit() {
        PopupExit.show();
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

