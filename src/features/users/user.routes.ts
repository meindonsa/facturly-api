import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authGuard } from '../../shared/middlewares/auth-guard.js';
import { UserService } from './user.service.js';
import { createAdminSchema, listUsersQuerySchema } from './user.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const userRoutes = new Hono<{ Variables: { auth: any } }>();

// POST /users/admin - Créer un admin (admin only)
userRoutes.post(
    '/admin',
    authGuard,
    zValidator('json', createAdminSchema),
    async (c) => {
        try {
            const auth = c.get('auth');

            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent créer un admin', 403);
            }

            const payload = c.req.valid('json');
            const newUser = await UserService.createAdmin(payload);
            return sendSuccess(c, newUser, 201);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la création';
            return sendError(c, 'CREATE_ADMIN_FAILED', message, 400);
        }
    }
);

// GET /users - Récupérer les utilisateurs
userRoutes.get(
    '/',
    authGuard,
    zValidator('query', listUsersQuerySchema),
    async (c) => {
        try {
            const auth = c.get('auth');
            const { page, limit, search, role, organizationId, isActive } = c.req.valid('query');

            const { data, total } = await UserService.listUsers(
                page,
                limit,
                auth.role as 'ADMIN' | 'USER',
                auth.organizationId,
                search,
                role,
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
            return sendError(c, 'LIST_USERS_FAILED', message, 400);
        }
    }
);

// PATCH /users/deactivate/:id - Désactiver un utilisateur (admin only)
userRoutes.patch(
    '/deactivate/:id',
    authGuard,
    async (c) => {
        try {
            const auth = c.get('auth');

            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent désactiver un utilisateur', 403);
            }

            const userId = c.req.param('id');

            if (!userId) {
                return sendError(c, 'INVALID_ID', 'ID utilisateur invalide', 400);
            }

            const updated = await UserService.deactivateUser(userId);
            return sendSuccess(c, updated, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la désactivation';
            return sendError(c, 'DEACTIVATE_USER_FAILED', message, 400);
        }
    }
);

// DELETE /users/:id - Supprimer un utilisateur (admin only)
userRoutes.delete(
    '/:id',
    authGuard,
    async (c) => {
        try {
            const auth = c.get('auth');

            if (auth.role !== 'ADMIN') {
                return sendError(c, 'FORBIDDEN', 'Seuls les administrateurs peuvent supprimer un utilisateur', 403);
            }

            const userId = c.req.param('id');

            if (!userId) {
                return sendError(c, 'INVALID_ID', 'ID utilisateur invalide', 400);
            }

            await UserService.deleteUser(userId);
            return sendSuccess(c, { message: 'L\'utilisateur a été supprimé avec succès' }, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la suppression';
            return sendError(c, 'DELETE_USER_FAILED', message, 400);
        }
    }
);

export default userRoutes;