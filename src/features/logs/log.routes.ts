import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authGuard } from '../../shared/middlewares/auth-guard.js';
import { LogService } from './log.service.js';
import { listLogsQuerySchema } from './log.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const logRoutes = new Hono<{ Variables: { auth: any } }>();

// GET /logs - Récupérer les logs (admin only)
logRoutes.get(
    '/',
    authGuard,
    zValidator('query', listLogsQuerySchema),
    async (c) => {
        try {
            const auth = c.get('auth');

            // Vérifier que c'est un ADMIN
            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent accéder aux logs', 403);
            }

            const { page, limit, level, action, organizationId, userId, entityType } = c.req.valid('query');
            const { data, total } = await LogService.listLogs(
                page,
                limit,
                level,
                action,
                organizationId,
                userId,
                entityType
            );

            const totalPages = Math.ceil(total / limit);

            return sendSuccess(c, {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            }, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la récupération';
            return sendError(c, 'LIST_LOGS_FAILED', message, 400);
        }
    }
);

export default logRoutes;