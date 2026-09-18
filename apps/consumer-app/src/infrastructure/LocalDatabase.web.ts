// Web-specific implementation using IndexedDB
// This file is automatically resolved by Metro bundler when targeting web.
// It DOES NOT import 'expo-sqlite', avoiding bundling errors.

const MAX_BUFFER_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export interface LocalEvent {
  id: number;
  type: string;
  payload: string; // JSON
  timestamp: number;
  hash?: string;
}

export class LocalDatabase {
  private static instance: LocalDatabase;

  // IndexedDB for Web
  private dbName = 'StyleSwipeDB';
  private dbVersion = 1;
  private idb: IDBDatabase | null = null;

  private constructor() {}

  static async getInstance(): Promise<LocalDatabase> {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
      await LocalDatabase.instance.init();
    }
    return LocalDatabase.instance;
  }

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Events Store
        if (!db.objectStoreNames.contains('events')) {
          const objectStore = db.createObjectStore('events', {
            keyPath: 'id',
            autoIncrement: true,
          });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        // Metadata Store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.idb = (event.target as IDBOpenDBRequest).result;
        console.log('[LocalDatabase] IndexedDB initialized (Web).');
        resolve();
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async bufferEvent(type: string, payload: any, hash?: string) {
    if (!this.idb) await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.idb!.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const request = store.add({
        type,
        payload: JSON.stringify(payload),
        timestamp: Date.now(),
        hash,
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getEvents(limit: number = 100): Promise<LocalEvent[]> {
    if (!this.idb) await this.init();
    return new Promise<LocalEvent[]>((resolve, reject) => {
      const transaction = this.idb!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      // Using getAll to fetch events (ordered by keyPath 'id' which is autoInc ~ chronological usually)
      // Ideally use index on timestamp but simple getAll is robust.
      const q = store.getAll(undefined, limit);
      q.onsuccess = () => {
        resolve(q.result as LocalEvent[]);
      };
      q.onerror = () => reject(q.error);
    });
  }

  async deleteEvents(ids: number[]) {
    if (ids.length === 0) return;
    if (!this.idb) await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.idb!.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');

      let successCount = 0;
      let errorCount = 0;

      ids.forEach((id) => {
        const req = store.delete(id);
        req.onsuccess = () => {
          successCount++;
          if (successCount + errorCount === ids.length) {
            if (errorCount > 0) reject('Some deletes failed');
            else resolve();
          }
        };
        req.onerror = () => {
          errorCount++;
          if (successCount + errorCount === ids.length) reject('Some deletes failed');
        };
      });
    });
  }

  async getDatabaseSize(): Promise<number> {
    if (!this.idb) await this.init();
    return new Promise<number>((resolve) => {
      const transaction = this.idb!.transaction(['events'], 'readonly');
      const store = transaction.objectStore('events');
      const req = store.count();
      req.onsuccess = () => resolve(req.result * 500); // Approximate
      req.onerror = () => resolve(0);
    });
  }

  async isBufferFull(): Promise<boolean> {
    const size = await this.getDatabaseSize();
    return size > MAX_BUFFER_SIZE_BYTES;
  }

  async getUserVector(): Promise<number[]> {
    if (!this.idb) await this.init();
    return new Promise<number[]>((resolve) => {
      const transaction = this.idb!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const req = store.get('user_vector_v1');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve(JSON.parse(req.result.value));
        } else {
          resolve(new Array(384).fill(0));
        }
      };
      req.onerror = () => resolve(new Array(384).fill(0));
    });
  }

  async saveUserVector(vector: number[]) {
    if (!this.idb) await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.idb!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const req = store.put({ key: 'user_vector_v1', value: JSON.stringify(vector) });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async getMetadata(key: string): Promise<string | null> {
    if (!this.idb) await this.init();
    return new Promise<string | null>((resolve) => {
      const transaction = this.idb!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result?.value as string) ?? null);
      req.onerror = () => resolve(null);
    });
  }

  private async setMetadata(key: string, value: string): Promise<void> {
    if (!this.idb) await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.idb!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getRecentSearches(): Promise<string[]> {
    const raw: string | null = await this.getMetadata('recent_searches_v1');
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  async saveRecentSearch(query: string): Promise<void> {
    const trimmed: string = query.trim();
    if (!trimmed) return;
    const existing: string[] = await this.getRecentSearches();
    const next: string[] = [trimmed, ...existing.filter((q: string) => q !== trimmed)].slice(0, 5);
    await this.setMetadata('recent_searches_v1', JSON.stringify(next));
  }

  async removeRecentSearch(query: string): Promise<void> {
    const existing: string[] = await this.getRecentSearches();
    await this.setMetadata('recent_searches_v1', JSON.stringify(existing.filter((q: string) => q !== query)));
  }

  async clearRecentSearches(): Promise<void> {
    if (!this.idb) await this.init();
    return new Promise<void>((resolve) => {
      const transaction = this.idb!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const req = store.delete('recent_searches_v1');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  }


  async getOnboardingState(): Promise<{ step: number; answers: Record<string, string>; welcomeDone: boolean } | null> {
    if (!this.idb) await this.init();
    return new Promise((resolve) => {
      const transaction = this.idb!.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const req = store.get('onboarding_state_v1');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          try {
            resolve(JSON.parse(req.result.value));
          } catch {
            resolve(null);
          }
        } else resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  }

  async saveOnboardingState(state: { step: number; answers: Record<string, string>; welcomeDone: boolean }): Promise<void> {
    if (!this.idb) await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.idb!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const req = store.put({ key: 'onboarding_state_v1', value: JSON.stringify(state) });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearOnboardingState(): Promise<void> {
    if (!this.idb) await this.init();
    return new Promise<void>((resolve, reject) => {
      const transaction = this.idb!.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const req = store.delete('onboarding_state_v1');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
