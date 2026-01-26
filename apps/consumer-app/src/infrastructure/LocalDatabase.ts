
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'events.db';
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
    private db: SQLite.SQLiteDatabase | null = null;

    private constructor() { }

    static async getInstance(): Promise<LocalDatabase> {
        if (!LocalDatabase.instance) {
            LocalDatabase.instance = new LocalDatabase();
            await LocalDatabase.instance.init();
        }
        return LocalDatabase.instance;
    }

    async init() {
        this.db = await SQLite.openDatabaseAsync(DB_NAME);
        await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        hash TEXT
      );
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async bufferEvent(type: string, payload: any, hash?: string) {
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'INSERT INTO events (type, payload, timestamp, hash) VALUES (?, ?, ?, ?)',
            type,
            JSON.stringify(payload),
            Date.now(),
            hash ?? null
        );
    }

    async getEvents(limit: number = 100): Promise<LocalEvent[]> {
        if (!this.db) await this.init();
        const result = await this.db!.getAllAsync<LocalEvent>(
            'SELECT * FROM events ORDER BY timestamp ASC LIMIT ?',
            limit
        );
        return result;
    }

    async deleteEvents(ids: number[]) {
        if (ids.length === 0) return;

        if (!this.db) await this.init();
        const placeholders = ids.map(() => '?').join(',');
        await this.db!.runAsync(
            `DELETE FROM events WHERE id IN (${placeholders})`,
            ...ids
        );
    }

    async getDatabaseSize(): Promise<number> {
        // SQLite size approximation or check file size via FileSystem if strict
        // For now, count rows * avg size or just query count
        if (!this.db) await this.init();
        const result = await this.db!.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM events');
        return (result?.count || 0) * 500; // crude 500 bytes per event estimate
    }

    async isBufferFull(): Promise<boolean> {
        const size = await this.getDatabaseSize();
        return size > MAX_BUFFER_SIZE_BYTES;
    }

    async getUserVector(): Promise<number[]> {
        if (!this.db) await this.init();
        // Schema created in init() now

        const result = await this.db!.getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key = ?', 'user_vector_v1');
        if (result && result.value) {
            return JSON.parse(result.value);
        }
        // Return zero vector or null (if cold start)
        return new Array(384).fill(0);
    }

    async saveUserVector(vector: number[]) {
        if (!this.db) await this.init();
        await this.db!.runAsync(
            'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
            'user_vector_v1',
            JSON.stringify(vector)
        );
    }
}
