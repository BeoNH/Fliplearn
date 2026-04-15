import { Prefab, resources } from 'cc';
import { Logger } from '../utils/Logger';

type LoadCallback<T> = (err: Error | null, asset: T | null) => void;

export class ResourceManager {
  private static _instance: ResourceManager | null = null;

  static get instance(): ResourceManager {
    if (!ResourceManager._instance) {
      ResourceManager._instance = new ResourceManager();
    }
    return ResourceManager._instance;
  }

  private constructor() {}

  loadPrefab(pathInResources: string, cb: LoadCallback<Prefab>): void {
    resources.load(pathInResources, Prefab, (err, prefab) => {
      if (err) {
        Logger.error('[ResourceManager]', 'loadPrefab failed', pathInResources, err);
        cb(err as Error, null);
        return;
      }
      cb(null, prefab);
    });
  }
}

