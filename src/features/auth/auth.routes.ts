import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { AuthService } from './auth.service.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

const authRoutes = new Hono();

authRoutes.post(
    '/register',
    zValidator('json', registerSchema),
    async (c) => {
        try {
            const payload = c.req.valid('json');
            const response = await AuthService.register(payload);
            return sendSuccess(c, response, 201);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
            return sendError(c, 'REGISTER_FAILED', message, 400);
        }
    }
);

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

export default authRoutes;