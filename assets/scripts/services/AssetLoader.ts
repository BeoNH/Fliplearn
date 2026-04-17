import {
    assetManager,
    Asset,
    ImageAsset,
    Texture2D,
    SpriteFrame,
    AudioClip,
    VideoPlayer,
    Node,
} from 'cc';

export class AssetLoader {

    private static cache = new Map<string, any>();

    // ─── Generic ─────────────────────────────────────────────────────────────

    static async loadRemote<T = any>(url: string, options?: { ext?: string }): Promise<T> {
        if (this.cache.has(url)) return this.cache.get(url);

        return new Promise((resolve, reject) => {
            assetManager.loadRemote(url, options ?? {}, (err, data) => {
                if (err) { reject(err); return; }
                this.cache.set(url, data);
                resolve(data as T);
            });
        });
    }

    // ─── Image ───────────────────────────────────────────────────────────────

    static async loadSpriteFrame(url: string): Promise<SpriteFrame> {
        if (this.cache.has(url)) return this.cache.get(url);

        const imageAsset = await this.loadRemote<ImageAsset>(url);

        const texture = new Texture2D();
        texture.image = imageAsset;

        const sf = new SpriteFrame();
        sf.texture = texture;

        this.cache.set(url, sf);
        return sf;
    }

    static async loadTexture(url: string): Promise<Texture2D> {
        const imageAsset = await this.loadRemote<ImageAsset>(url, { ext: '.png' });
        const texture = new Texture2D();
        texture.image = imageAsset;
        return texture;
    }

    // ─── Audio ───────────────────────────────────────────────────────────────

    /**
     * Load AudioClip từ URL
     * Hỗ trợ: .mp3 | .ogg | .wav | .m4a
     */
    static async loadAudio(url: string, ext: '.mp3' | '.ogg' | '.wav' | '.m4a' = '.mp3'): Promise<AudioClip> {
        if (this.cache.has(url)) return this.cache.get(url);

        return new Promise((resolve, reject) => {
            assetManager.loadRemote<AudioClip>(url, { ext }, (err, clip) => {
                if (err) { reject(err); return; }
                this.cache.set(url, clip);
                resolve(clip);
            });
        });
    }

    // ─── Video ───────────────────────────────────────────────────────────────

    // ─── Cache ───────────────────────────────────────────────────────────────

    static clearCache(url?: string): void {
        if (url) {
            this.cache.delete(url);
        } else {
            this.cache.clear();
        }
    }
}