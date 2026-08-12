import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authGuard } from '../../shared/middlewares/auth-guard.js';
import { OrganizationService } from './organization.service.js';
import {
    createOrganizationSchema, listOrganizationsQuerySchema,
    updateOrganizationInfoSchema,
    updateOrganizationStatusSchema,
} from './organization.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const organizationRoutes = new Hono<{ Variables: { auth: any } }>();

// POST /organizations - Créer une nouvelle organisation (admin only)
organizationRoutes.post(
    '/',
    authGuard,
    zValidator('json', createOrganizationSchema),
    async (c) => {
        try {
            const auth = c.get('auth');

            // Vérifier que c'est un ADMIN
            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent créer une organisation', 403);
            }

            const payload = c.req.valid('json');
            const org = await OrganizationService.createOrganization(payload);
            return sendSuccess(c, org, 201);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la création';
            return sendError(c, 'CREATE_ORGANIZATION_FAILED', message, 400);
        }
    }
);

// GET /organizations/:id - Récupérer une organisation
organizationRoutes.get(
    '/:id',
    authGuard,
    async (c) => {
        try {
            const orgId: string | undefined = c.req.param('id');
            if(!orgId || orgId.trim().length ==0) {
                return sendError(c, 'NOT_FOUND', 'Organisation introuvable', 404);
            }
            const org = await OrganizationService.getOrganization(orgId);

            if (!org) {
                return sendError(c, 'NOT_FOUND', 'Organisation introuvable', 404);
            }

            return sendSuccess(c, org, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la récupération';
            return sendError(c, 'GET_ORGANIZATION_FAILED', message, 400);
        }
    }
);

// PATCH /organizations/:id/info - Mettre à jour les infos
organizationRoutes.patch(
    '/:id/info',
    authGuard,
    zValidator('json', updateOrganizationInfoSchema),
    async (c) => {
        try {
            const auth = c.get('auth');
            const orgId = c.req.param('id');
            const payload = c.req.valid('json');

            // Vérifier que c'est un ADMIN ou le user de cette org
            if (auth.role !== 'USER' || auth.organizationId !== orgId) {
                return sendError(c, 'FORBIDDEN', 'Vous n\'avez pas accès à cette organisation', 403);
            }

            const org = await OrganizationService.updateOrganizationInfo(orgId, payload);
            return sendSuccess(c, org, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
            return sendError(c, 'UPDATE_ORGANIZATION_FAILED', message, 400);
        }
    }
);

// PATCH /organizations/:id/status - Changer le statut (admin only)
organizationRoutes.patch(
    '/:id/status',
    authGuard,
    zValidator('json', updateOrganizationStatusSchema),
    async (c) => {
        try {
            const auth = c.get('auth');

            // Seul un ADMIN peut changer le statut
            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent changer le statut', 403);
            }

            const orgId = c.req.param('id');
            const payload = c.req.valid('json');
            const org = await OrganizationService.updateOrganizationStatus(orgId, payload);
            return sendSuccess(c, org, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut';
            return sendError(c, 'UPDATE_STATUS_FAILED', message, 400);
        }
    }
);

// PATCH /organizations/:id/logo - Mettre à jour le logo (URL)
organizationRoutes.patch(
    '/:id/logo',
    authGuard,
    zValidator('json', z.object({ logoUrl: z.url('L\'URL du logo est invalide') })),
    async (c) => {
        try {
            const auth = c.get('auth');
            const orgId = c.req.param('id');
            const { logoUrl } = c.req.valid('json');

            // Vérifier que c'est un ADMIN ou le user de cette org
            if (auth.role !== 'USER' || auth.organizationId !== orgId) {
                return sendError(c, 'FORBIDDEN', 'Vous n\'avez pas accès à cette organisation', 403);
            }

            const org = await OrganizationService.updateOrganizationLogo(orgId, logoUrl);
            return sendSuccess(c, org, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du logo';
            return sendError(c, 'UPDATE_LOGO_FAILED', message, 400);
        }
    }
);

organizationRoutes.get(
    '/',
    authGuard,
    zValidator('query', listOrganizationsQuerySchema),
    async (c) => {
        try {
            const { page, limit, search } = c.req.valid('query');
            const { data, total } = await OrganizationService.listOrganizations(page, limit, search);

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
            return sendError(c, 'LIST_ORGANIZATIONS_FAILED', message, 400);
        }
    }
);

export default organizationRoutes;