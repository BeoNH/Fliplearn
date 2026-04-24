import { resources, JsonAsset, EventTarget } from 'cc';

export class LocalizationManager extends EventTarget {
    private static _instance: LocalizationManager;
    private _currentLang: string = 'vi';
    private _data: Record<string, any> = {};

    static readonly EVENT_LANG_CHANGED = 'lang_changed';
    private readonly SAVE_KEY = 'game_language';

    static get instance(): LocalizationManager {
        if (!this._instance) {
            this._instance = new LocalizationManager();
        }
        return this._instance;
    }

    // Đổi ngôn ngữ runtime
    async switchLanguage(lang: string): Promise<void> {
        await this.loadLanguage(lang);
        this.emit(LocalizationManager.EVENT_LANG_CHANGED, lang);
    }

    // Lấy text — hỗ trợ nested key "menu.play"
    t(key: string, ...args: (string | number)[]): string {
        const text = this._resolve(key);
        if (!text) {
            console.warn(`[i18n] Missing key: "${key}"`);
            return key;
        }

        return text.replace(/\{(\d+)\}/g, (_, i) => String(args[+i] ?? ''));
    }

    get currentLang() { return this._currentLang; }

    private async loadLanguage(lang: string): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load(`i18n/${lang}`, JsonAsset, (err, asset) => {
                if (err) {
                    console.error(`[i18n] Cannot load language: ${lang}`, err);
                    if (lang !== 'vi') this.loadLanguage('vi').then(resolve);
                    else reject(err);
                    return;
                }
                this._data = asset.json;
                this._currentLang = lang;
                resolve();
            });
        });
    }

    private _resolve(key: string): string | null {
        const parts = key.split('.');
        let obj: any = this._data;
        for (const p of parts) {
            if (obj == null || typeof obj !== 'object') return null;
            obj = obj[p];
        }
        return typeof obj === 'string' ? obj : null;
    }
}

export const i18n = LocalizationManager.instance;