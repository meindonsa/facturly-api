import { Context, type Next } from 'hono';
import { rateLimiters } from '../utils/rate-limiter.js';
import { sendError } from '../utils/response.js';

function getLimiterForRoute(path: string) {
    if (path.includes('/auth')) return rateLimiters.auth;
    return rateLimiters.api;
}

// Générer une clé unique par utilisateur ou IP
function getIdentifier(c: Context): string {
    const auth = c.get('auth') as any;

    // Si l'utilisateur est authentifié, limiter par user ID
    if (auth?.userId) {
        return `user:${auth.userId}`;
    }

    // Sinon, limiter par IP
    const ip = c.req.header('x-forwarded-for') ||
        c.req.header('cf-connecting-ip') ||
        'unknown';
    return `ip:${ip}`;
}

export const rateLimitMiddleware = async (c: Context, next: Next) => {
    const limiter = getLimiterForRoute(c.req.path);
    const identifier = getIdentifier(c);

    const result = limiter.isLimited(identifier);

    // Ajouter les headers
    c.header('X-RateLimit-Limit', limiter['config'].maxRequests.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

    if (result.isLimited) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        c.header('Retry-After', retryAfter.toString());

        return sendError(
            c,
            'RATE_LIMIT_EXCEEDED',
            `Trop de requêtes. Réessayez dans ${retryAfter}s`,
            429
        );
    }

    await next();
};