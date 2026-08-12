import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AuthService } from './auth.service.js';
import {
    registerAdminSchema,
    registerUserSchema,
    loginSchema,
    refreshTokenSchema
} from './auth.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import {authGuard, type AuthPayload} from "../../shared/middlewares/auth-guard.js";

const authRoutes = new Hono<{Variables: {auth: AuthPayload}}>();

// POST /auth/register/admin - Créer un nouvel ADMIN
authRoutes.post(
    '/register/admin',
    zValidator('json', registerAdminSchema),
    async (c) => {
        try {
            const payload = c.req.valid('json');
            const response = await AuthService.registerAdmin(payload);
            return sendSuccess(c, response, 201);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription de l\'admin';
            return sendError(c, 'REGISTER_ADMIN_FAILED', message, 400);
        }
    }
);

// POST /auth/register - Créer un nouvel USER
authRoutes.post(
    '/register',
    zValidator('json', registerUserSchema),
    async (c) => {
        try {
            const payload = c.req.valid('json');
            const response = await AuthService.registerUser(payload);
            return sendSuccess(c, response, 201);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription de l\'utilisateur';
            return sendError(c, 'REGISTER_USER_FAILED', message, 400);
        }
    }
);

// POST /auth/login - Connexion (reste identique)
authRoutes.post(
    '/login',
    zValidator('json', loginSchema),
    async (c) => {
        try {
            const payload = c.req.valid('json');
            const response = await AuthService.login(payload);
            return sendSuccess(c, response, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la connexion';
            return sendError(c, 'LOGIN_FAILED', message, 401);
        }
    }
);

// POST /auth/refresh - Rafraîchir l'access token (reste identique)
authRoutes.post(
    '/refresh',
    zValidator('json', refreshTokenSchema),
    async (c) => {
        try {
            const payload = c.req.valid('json');
            const response = await AuthService.refreshAccessToken(payload.refreshToken);
            return sendSuccess(c, response, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors du rafraîchissement';
            return sendError(c, 'REFRESH_FAILED', message, 401);
        }
    }
);

authRoutes.post(
    '/logout',
    authGuard,
    async (c) => {
        try {
            const auth: any = c.get('auth') as any;
            await AuthService.logoutByRefreshTokenId(auth.refreshTokenId);
            return sendSuccess(c, { message: 'Vous avez été déconnecté avec succès' }, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la déconnexion';
            return sendError(c, 'LOGOUT_FAILED', message, 401);
        }
    }
);

export default authRoutes;