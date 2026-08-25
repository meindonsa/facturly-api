interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Temps de vie en ms
}

interface CacheConfig {
    ttl?: number; // TTL par défaut (ms)
    maxSize?: number; // Nombre max d'entrées
}

export class CacheManager {
    private store: Map<string, CacheEntry<any>> = new Map();
    private config: Required<CacheConfig>;

    constructor(config: CacheConfig = {}) {
        this.config = {
            ttl: config.ttl || 5 * 60000, // 5 minutes par défaut
            maxSize: config.maxSize || 1000,
        };
    }

    /**
     * Récupérer une valeur du cache
     */
    get<T>(key: string): T | null {
        const entry = this.store.get(key);

        if (!entry) return null;

        // Vérifier si le cache a expiré
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.store.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Stocker une valeur dans le cache
     */
    set<T>(key: string, data: T, ttl?: number): void {
        // Nettoyer si dépassement de taille
        if (this.store.size >= this.config.maxSize) {
            const firstKey = this.store.keys().next().value;
            if (firstKey !== undefined) { // ✅ Vérifier avant de supprimer
                this.store.delete(firstKey);
            }
        }

        this.store.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.config.ttl,
        });
    }

    /**
     * Invalider une clé ou toutes les clés matching un pattern
     */
    invalidate(pattern?: string): void {
        if (!pattern) {
            this.store.clear();
            return;
        }

        // Invalider les clés matching le pattern (regex ou simple string)
        for (const key of this.store.keys()) {
            if (key.includes(pattern)) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Obtenir les stats du cache
     */
    getStats() {
        return {
            size: this.store.size,
            maxSize: this.config.maxSize,
        };
    }
}

// Instance globale du cache
export const cache = new CacheManager({
    ttl: 5 * 60000, // 5 minutes
    maxSize: 500,
});

/**
 * Générer une clé de cache à partir d'une URL et des query params
 */
export function generateCacheKey(path: string, query?: Record<string, any>): string {
    let key = `GET:${path}`;

    if (query && Object.keys(query).length > 0) {
        const queryString = new URLSearchParams(query).toString();
        key += `?${queryString}`;
    }

    return key;
}