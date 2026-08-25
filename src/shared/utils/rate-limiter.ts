// Store en mémoire simple (pour un déploiement single-instance)
// Pour la production avec plusieurs instances, utiliser Redis
interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Nettoyer les anciennes entrées toutes les minutes
setInterval(() => {
    const now = Date.now();
    for (const key in store) {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    }
}, 60000);

export interface RateLimitConfig {
    windowMs: number; // Fenêtre de temps en ms
    maxRequests: number; // Nombre max de requêtes
    keyGenerator?: (identifier: string) => string; // Personnaliser la clé
}

export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            keyGenerator: (identifier) => identifier,
            ...config,
        };
    }

    isLimited(identifier: string): { isLimited: boolean; remaining: number; resetTime: number } {
        const key = this.config.keyGenerator!(identifier);
        const now = Date.now();

        // Initialiser ou récupérer le compteur
        if (!store[key]) {
            store[key] = {
                count: 0,
                resetTime: now + this.config.windowMs,
            };
        }

        const entry = store[key];

        // Si la fenêtre est expirée, réinitialiser
        if (entry.resetTime < now) {
            entry.count = 0;
            entry.resetTime = now + this.config.windowMs;
        }

        // Incrémenter le compteur
        entry.count++;

        const remaining = Math.max(0, this.config.maxRequests - entry.count);
        const isLimited = entry.count > this.config.maxRequests;

        return {
            isLimited,
            remaining,
            resetTime: entry.resetTime,
        };
    }
}

// Instances prédéfinies avec différentes limites
export const rateLimiters = {
    // Auth : limite stricte (5 par minute)
    auth: new RateLimiter({
        windowMs: 60000, // 1 minute
        maxRequests: 5,
    }),

    // API générale : 60 par minute
    api: new RateLimiter({
        windowMs: 60000,
        maxRequests: 60,
    }),

    // Endpoints spécifiques : 100 par 15 minutes
    specific: new RateLimiter({
        windowMs: 15 * 60000,
        maxRequests: 100,
    }),
};