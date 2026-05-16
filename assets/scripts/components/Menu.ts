import { _decorator, Component, director, EventTouch, Label, log, Node, tween, Tween, Vec3 } from 'cc';
import { apiGameInfo, apiPlay } from '../dataDemo';
import { GameManager } from '../managers/GameManager';
import { PopupBXH } from './Popup/PopupBXH';
import { i18n } from '../i18n/LocalizationManager';
import { NetworkManager, urlParam } from '../managers/NetworkManager';
import AssetLoader from '../services/AssetLoader';
import { Logger } from '../utils/Logger';
import { CardType, ICardInfo, ILevelConfig } from '../common/GameTypes';
import BroadcastReceiver from '../common/BroadcastReceiver';
import { ON_GAME_START } from '../common/GameEvents';
import { Dialog } from './Popup/PopupDialog';
const { ccclass, property } = _decorator;

@ccclass('Menu')
export class Menu extends Component {

    @property({ type: Label, tooltip: 'Mô tả về game' })
    private labelDesc: Label = null!;

    @property({ type: Node, tooltip: 'Nút bấm chơi game' })
    buttonPlay: Node = null!;

    @property({ type: Node, tooltip: 'Icon load màn' })
    loadingIcon: Node = null!;

    protected async onLoad() {
        i18n.switchLanguage(urlParam("lang") ?? "en");

        BroadcastReceiver.register(ON_GAME_START, this.onTapPlay.bind(this), this);

        this.labelDesc.string = GameManager.instance?.GameInfo?.description;

        if (NetworkManager.instance.hasAccessToken) return;
        try {
            const login = await NetworkManager.instance.httpPost("/api/auth/login", { lingoxToken: urlParam("token") });
            if (!login?.success) {
                Dialog.show(`${login?.code ?? "-1"} : ${login?.message ?? "null"}`);
                return;
            }
            NetworkManager.instance.setAccessToken(login?.data?.accessToken);

            const apiGameInfo = await NetworkManager.instance.httpPost("/api/flipCard/getTopic", { id: 1 });
            if (!apiGameInfo?.success) {
                Dialog.show(`${apiGameInfo?.code ?? "-1"} : ${apiGameInfo?.message ?? "null"}`);
                return;
            }
            const data = apiGameInfo.data ?? {};
            const lang = i18n.currentLang;

            GameManager.instance.GameInfo = {
                gameId: data.id ?? -1,
                title: data.name ?? "",
                description: data.introduction?.[lang] ?? "",
                introduction: data.introduction?.[lang] ?? ""
            };
            this.labelDesc.string = GameManager.instance.GameInfo.description;

        } catch (err) {
            Logger.error(err);
        }
    }

    protected onDestroy(): void {
        Tween.stopAllByTarget(this.loadingIcon);
        BroadcastReceiver.unRegisterByTarget(this);
    }

    private mappingLevel(data: any): ILevelConfig[] {
        const lang = i18n.currentLang;

        let mappedPairs: { cardA: ICardInfo; cardB: ICardInfo }[] =
            data.pairs.map((e, i) => ({
                cardA: {
                    cardId: `c${i}a`,
                    pairId: `pid${i}`,
                    type: CardType.TEXT,
                    content: e.pairAText,
                    image: "",
                    bonus: e.bonusPoint ?? 0,
                },
                cardB: {
                    cardId: `c${i}b`,
                    pairId: `pid${i}`,
                    type: e.pairBImage ? (e.pairBText && Object.keys(e.pairBText).length > 0 ? CardType.DEFINITION : CardType.IMAGE) : CardType.TEXT,
                    content: e.pairBText?.[lang] ?? e.pairBText?.en ?? "",
                    image: e.pairBImage ?? "",
                    bonus: e.bonusPoint ?? 0,
                }
            }));
        mappedPairs = this.shuffle(mappedPairs);

        const levels = data.topic.levels;
        const hasTimeLimit = data.topic.durationEnable;
        let offset = 0;

        return levels
            .map((lv, index) => {
                const pairsForLevel = mappedPairs.slice(offset, offset + lv.pairsLength);
                offset += lv.pairsLength;

                // if (pairsForLevel.length < lv.pairsLength) return null;
                if (pairsForLevel.length === 0) return null;

                const totalCards = pairsForLevel.length * 2;
                const rows = Math.ceil(Math.sqrt(totalCards));
                const cols = Math.ceil(totalCards / rows);

                return {
                    levelId: index + 1,
                    hasTimeLimit,
                    timeLimit: lv.duration,
                    rows,
                    cols,
                    pairs: pairsForLevel
                };
            })
            .filter(Boolean) as ILevelConfig[];
    }

    private async preloadLevelAssets() {
        const tasks: Promise<any>[] = [];

        for (const level of apiPlay) {
            for (const pair of level.pairs) {
                [pair.cardA, pair.cardB].forEach(card => {
                    if (card.image) {
                        tasks.push(AssetLoader.loadSpriteFrame(card.image));
                    }
                });
            }
        }

        await Promise.all(tasks);
    }

    private shuffle<T>(input: T[]): T[] {
        const a = input.slice();
        for (let i = a.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
        return a;
    }


    async onTapPlay(e: EventTouch) {

        tween(this.loadingIcon)
            .repeatForever(
                tween().by(1.5, { eulerAngles: new Vec3(0, 0, -360) })
            )
            .start();

        try {
            this.buttonPlay.active = false;
            this.loadingIcon.active = true;

            const res = await NetworkManager.instance.httpPost("/api/flipCard/play", { id: 1 });
            if (!res || !res.data || !res?.success) {
                Dialog.show(`${res?.code ?? "-1"} : ${res?.message ?? "null"}`);
                throw new Error("play API: invalid response");
            }

            const levelConfig = this.mappingLevel(res.data);
            console.log(levelConfig)
            if (!levelConfig || levelConfig.length === 0) {
                throw new Error("No valid levelConfig");
            }

            GameManager.instance.LevelConfig = levelConfig;
            GameManager.instance.ApiSession = res.data.gameSession;

            await this.preloadLevelAssets();

            await new Promise<void>((resolve, reject) =>
                director.preloadScene("Game", null, err => err ? reject(err) : resolve())
            );
            director.loadScene("Game");

        } catch (err) {
            console.error(err);

            this.buttonPlay.active = true;
            this.loadingIcon.active = false;
            Tween.stopAllByTarget(this.loadingIcon);
        }

    }

    onTapBXH() {
        PopupBXH.show();
    }
}


