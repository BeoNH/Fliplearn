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
            NetworkManager.instance.setAccessToken(login?.data?.accessToken);

            const apiGameInfo = await NetworkManager.instance.httpPost("/api/flipCard/getTopic", { id: 1 });
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

        const mappedPairs: { cardA: ICardInfo; cardB: ICardInfo }[] =
            data.pairs.map((e, i) => ({
                cardA: {
                    cardId: `c${i}a`,
                    pairId: `pid${i}`,
                    type: CardType.TEXT,
                    content: e.pairAtext,
                    image: "",
                    bonus: e.bonusPoint ?? 0,
                },
                cardB: {
                    cardId: `c${i}b`,
                    pairId: `pid${i}`,
                    type: e.pairBimage ? (e.pairBtext ? CardType.DEFINITION : CardType.IMAGE) : CardType.TEXT,
                    content: e.pairBtext?.[lang] ?? e.pairBtext?.en ?? "",
                    image: e.pairBimage ?? "",
                    bonus: e.bonusPoint ?? 0,
                }
            }));

        const levels = data.topic.options.levels;
        const hasTimeLimit = data.topic.options.durationEnable;

        return levels
            .filter(lv => lv.pairsLength <= mappedPairs.length)
            .map((lv, index) => {
                const pairsForLevel = this.shuffle(mappedPairs).slice(0, lv.pairsLength);

                const totalCards = pairsForLevel.length * 2;
                const cols = Math.max(1, Math.floor(Math.sqrt(totalCards * 0.8)));
                const rows = Math.ceil(totalCards / cols);

                return {
                    levelId: index + 1,
                    hasTimeLimit,
                    timeLimit: lv.duration,
                    rows,
                    cols,
                    pairs: pairsForLevel
                };
            });
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
            if (!res || !res.data) {
                throw new Error("play API: invalid response");
            }

            const levelConfig = this.mappingLevel(res.data);
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


