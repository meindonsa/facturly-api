import { Hono } from 'hono';
import { authGuard } from '../../shared/middlewares/auth-guard.js';
import { cache } from '../../shared/utils/cache.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const cacheRoutes = new Hono<{ Variables: { auth: any } }>();

// GET /cache/stats - Voir les stats du cache
cacheRoutes.get(
    '/stats',
    authGuard,
    async (c) => {
        const auth = c.get('auth');

        if (auth.role !== 'ADMIN') {
            return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent accéder aux stats du cache', 403);
        }

        const stats = cache.getStats();
        return sendSuccess(c, stats, 200);
    }
);

// DELETE /cache/invalidate - Vider tout le cache
cacheRoutes.delete(
    '/invalidate',
    authGuard,
    async (c) => {
        const auth = c.get('auth');

        if (auth.role !== 'ADMIN') {
            return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent invalider le cache', 403);
        }

        cache.invalidate();
        return sendSuccess(c, { message: 'Cache invalidé' }, 200);
    }
);

// DELETE /cache/invalidate/:pattern - Vider le cache pour un pattern
cacheRoutes.delete(
    '/invalidate/:pattern',
    authGuard,
    async (c) => {
        const auth = c.get('auth');

        if (auth.role !== 'ADMIN') {
            return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent invalider le cache', 403);
        }

        const pattern = c.req.param('pattern');
        cache.invalidate(pattern);
        return sendSuccess(c, { message: `Cache invalidé pour le pattern: ${pattern}` }, 200);
    }
);

export default cacheRoutes;