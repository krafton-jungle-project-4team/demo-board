import { Injectable } from "@nestjs/common";

type CacheEntry<TValue> = {
    value: TValue;
    expiresAt: number;
};

@Injectable()
export class TmapCacheService {
    private readonly entries = new Map<string, CacheEntry<unknown>>();

    get<TValue>(key: string): TValue | null {
        const entry = this.entries.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.entries.delete(key);

            return null;
        }

        return entry.value as TValue;
    }

    set<TValue>(key: string, value: TValue, ttlSeconds: number) {
        this.entries.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
    }
}
