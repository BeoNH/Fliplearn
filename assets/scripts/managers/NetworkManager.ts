import { Logger } from '../utils/Logger';

export class NetworkManager {
    private static _instance: NetworkManager | null = null;

    static get instance(): NetworkManager {
        if (!NetworkManager._instance) {
            NetworkManager._instance = new NetworkManager();
        }
        return NetworkManager._instance;
    }

    private baseUrl: string = "Link game";

    private constructor() { }

    setBaseUrl(url: string): void {
        this.baseUrl = url;
    }

    // async saveScore(payload: ISaveScoreRequest): Promise<ISaveScoreResponse> {
    //     return this.requestJson<ISaveScoreResponse>('/api/saveScore', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(payload),
    //     });
    // }

    async getLeaderboard(): Promise<any> {
        return this.requestJson('/api/leaderboard', { method: 'GET' });
    }

    private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        try {
            const response = await fetch(url, init);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }
            const data = (await response.json()) as T;
            return data;
        } catch (error) {
            Logger.error('[NetworkManager]', 'requestJson failed', url, error);
            throw error;
        }
    }
}
