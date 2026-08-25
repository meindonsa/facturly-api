import { Context, type Next } from 'hono';
import { cache, generateCacheKey } from '../utils/cache.js';

export const cachingMiddleware = async (c: Context, next: Next) => {
    // Seulement mettre en cache les GET
    if (c.req.method !== 'GET') {
        await next();
        return;
    }

    // Permettre de bypass le cache avec un header ou query param
    const bypassCache =
        c.req.header('X-Bypass-Cache') === 'true' ||
        c.req.url.includes('?cache=false');

    if (bypassCache) {
        await next();
        return;
    }

    // Générer la clé de cache
    const queryParams = Object.fromEntries(new URL(c.req.url).searchParams);
    const cacheKey = generateCacheKey(c.req.path, queryParams);

    // Vérifier le cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        c.header('X-Cache', 'HIT');
        return c.json(cachedData, 200);
    }

    // ✅ Stocker la réponse avant de la renvoyer
    let responseData: any = null;

    // Intercepter c.json
    const originalJson = c.json.bind(c);
    c.json = function(data: any, init?: any) {
        // Extraire le status code
        const status = typeof init === 'number' ? init : init?.status || 200;

        // Mettre en cache seulement les réponses 200 avec succès
        if (status === 200 && data?.success === true) {
            cache.set(cacheKey, data);
            c.header('X-Cache', 'MISS');
        } else if (status !== 200) {
            c.header('X-Cache', 'BYPASS'); // Ne pas cacher les erreurs
        }

        return originalJson(data, init);
    };

    await next();
};