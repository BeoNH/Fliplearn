import { _decorator, Component, instantiate, Label, Node, Prefab, v3 } from 'cc';
import AssetLoader from '../../services/AssetLoader';
import Popup from '../../common/Popup';
import { NetworkManager, urlParam } from '../../managers/NetworkManager';
import BroadcastReceiver from '../../common/BroadcastReceiver';
import { ON_GAME_START } from '../../common/GameEvents';
import { Dialog } from './PopupDialog';

const { ccclass, property } = _decorator;

@ccclass('PopupBXH')
export class PopupBXH extends Popup {
    public static async show() {
        let prefab = await AssetLoader.loadResAsync<Prefab>("prefabs/popupBXH", Prefab);
        if (!prefab) return;
        let node = instantiate(prefab);
        node.getComponent(PopupBXH).show();
    }

    show() {
        super.show();
    }

    @property({ type: Node, tooltip: "Bộ top 3 người cao nhất" })
    protected layoutTOP3: Node = null;

    @property({ type: Node, tooltip: "Bộ các thứ tự còn lại" })
    protected layoutBXH: Node = null;

    @property({ type: Node, tooltip: "Các dòng trỏng bảng" })
    protected itemBXH: Node = null;

    @property({ type: Node, tooltip: "Bảng xếp hạng của người chơi" })
    protected playerRank: Node = null;

    @property({ type: Node, tooltip: "Giao diện hiển thị theo data" })
    protected stateTop: Node[] = [];

    private board;

    onLoad(): void {
        this.stateTop.forEach(e => e.active = false)
    }

    protected async onBeforeShow() {
        this.board = await NetworkManager.instance.httpPost("/api/flipCard/leaderboard", { id: urlParam("gid") });
        if (!this.board?.success) {
            Dialog.show(`${this.board?.code ?? "-1"} : ${this.board?.message ?? "null"}`);
        }
    }

    // Khởi tạo bảng
    protected onAfterShow(): void {
        const listBXH: any[] = this.board?.data?.top100; // mảng dữ liệu xếp hạng

        // Kiểm tra có BXH không
        const isEmpty = !listBXH || listBXH.length === 0;
        this.stateTop[0].active = !isEmpty;
        this.stateTop[1].active = isEmpty;
        if (isEmpty) return;

        //Top3
        for (let i = 0; i < 3; i++) {
            const e = this.layoutTOP3.children[i];
            e.active = false;
            if (listBXH[i]) {
                e.active = true;
                e.getChildByPath("txtName").getComponent(Label).string = this.limitName(listBXH[i].nickname, 8);
                e.getChildByPath("txtScore").getComponent(Label).string = listBXH[i].score;
            }
        }

        // Số lượng item cho phần còn lại (BXH ngoài top3)
        const remCount = listBXH.length - 3;
        const pool = this.layoutBXH.children;

        // Duyệt qua số lượng item cần hiển thị
        for (let j = 0; j < remCount; j++) {
            let item: Node;
            if (j < pool.length) {
                item = pool[j];
                item.active = true;
            } else {
                item = instantiate(this.itemBXH);
                item.parent = this.layoutBXH;
                item.active = true;
            }

            // Cập nhật thông tin cho item
            const rankIndex = j + 3;
            item.getChildByPath("txtRank").getComponent(Label).string = `${rankIndex + 1}`;
            item.getChildByPath("txtName").getComponent(Label).string = this.limitName(listBXH[rankIndex].nickname);
            item.getChildByPath("txtTime").getComponent(Label).string = this.formatTime(listBXH[rankIndex].playTime);
            item.getChildByPath("txtScore").getComponent(Label).string = listBXH[rankIndex].score;
        }

        // Ẩn đi những item dư thừa
        if (remCount > 0) {
            for (let k = remCount; k < pool.length; k++) {
                pool[k].active = false;
            }
        }

        // Cập nhật thông tin xếp hạng của người chơi
        const root = this.playerRank;
        const yourInfo = this.board?.data?.your;

        const nameLb = root.getChildByPath("playerName")?.getComponent(Label);
        const rankLb = root.getChildByPath("stt/playerRank")?.getComponent(Label);
        const scoreLb = root.getChildByPath("Layout/playerScore")?.getComponent(Label);
        const timeNode = root.getChildByPath("Layout/playerTime");
        const noneRank = root.getChildByPath("noneRank");
        const timeLb = timeNode?.getComponent(Label);
        const hasRank = (yourInfo?.rank ?? 0) > 0;

        if (nameLb) nameLb.string = this.limitName(yourInfo?.nickname ?? "Guest");

        if (noneRank) noneRank.active = !hasRank;
        if (timeNode) timeNode.active = hasRank;
        if (!hasRank) {
            root.setPosition(v3(0, -650, 0));
            if (scoreLb) scoreLb.string = "0";
            return;
        }

        if (rankLb) rankLb.string = yourInfo.rank.toString();
        if (timeLb) timeLb.string = this.formatTime(yourInfo.playTime);
        if (scoreLb) scoreLb.string = yourInfo.score.toString();
    }

    // Giới hạn text không quá dài
    private limitName(name: string, maxLength: number = 12): string {
        if (name.length > maxLength) {
            return name.substring(0, maxLength) + ' . . .';
        }
        return name;
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

    onTabPlay() {
        BroadcastReceiver.send(ON_GAME_START);
        super.hide();
    }
}


