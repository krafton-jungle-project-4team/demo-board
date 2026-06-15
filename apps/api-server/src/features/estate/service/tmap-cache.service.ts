type CacheEntry<T> = {
    value: T;
    expiresAtMs: number;
};

export class TmapCacheService {
    private readonly entries = new Map<string, CacheEntry<unknown>>();

    get<T>(key: string): T | null {
        const entry = this.entries.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() >= entry.expiresAtMs) {
            this.entries.delete(key);

            return null;
        }

        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlSeconds: number) {
        this.entries.set(key, {
            value,
            expiresAtMs: Date.now() + ttlSeconds * 1000
        });
    }
}
