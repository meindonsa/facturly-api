import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authGuard } from '../../shared/middlewares/auth-guard.js';
import { SubscriptionService } from './subscription.service.js';
import {
    createSubscriptionSchema,
    listSubscriptionsQuerySchema,
} from './subscription.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const subscriptionRoutes = new Hono<{ Variables: { auth: any } }>();

// POST /subscriptions - Créer un abonnement (admin only)
subscriptionRoutes.post(
    '/',
    authGuard,
    zValidator('json', createSubscriptionSchema),
    async (c) => {
        try {
            const auth = c.get('auth');

            // Vérifier que c'est un ADMIN
            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent créer un abonnement', 403);
            }

            const payload = c.req.valid('json');
            const sub = await SubscriptionService.createSubscription(payload);
            return sendSuccess(c, sub, 201);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la création';
            return sendError(c, 'CREATE_SUBSCRIPTION_FAILED', message, 400);
        }
    }
);

// GET /subscriptions/active/:organizationId - Récupérer l'abonnement actif
subscriptionRoutes.get(
    '/active/:organizationId',
    authGuard,
    async (c) => {
        try {
            const auth = c.get('auth');
            const organizationId = c.req.param('organizationId');

            if (!organizationId) {
                return sendError(c, 'INVALID_ID', 'ID d\'organisation invalide', 400);
            }

            // Vérifier l'accès : ADMIN ou USER de cette org
            if (auth.role === 'USER' && auth.organizationId !== organizationId) {
                return sendError(c, 'FORBIDDEN', 'Vous n\'avez pas accès à cette organisation', 403);
            }

            const sub = await SubscriptionService.getActiveSubscription(organizationId);

            if (!sub) {
                return sendError(c, 'NOT_FOUND', 'Pas d\'abonnement actif pour cette organisation', 404);
            }

            return sendSuccess(c, sub, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la récupération';
            return sendError(c, 'GET_SUBSCRIPTION_FAILED', message, 400);
        }
    }
);

// GET /subscriptions - Récupérer tous les abonnements (admin only)
subscriptionRoutes.get(
    '/',
    authGuard,
    zValidator('query', listSubscriptionsQuerySchema),
    async (c) => {
        try {
            const auth = c.get('auth');

            // Vérifier que c'est un ADMIN
            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent accéder à cette ressource', 403);
            }

            const { page, limit, organizationId, isActive } = c.req.valid('query');
            const { data, total } = await SubscriptionService.listSubscriptions(
                page,
                limit,
                organizationId,
                isActive
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
            return sendError(c, 'LIST_SUBSCRIPTIONS_FAILED', message, 400);
        }
    }
);

export default subscriptionRoutes;