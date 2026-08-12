import { Context, type Next} from 'hono';
import { verifyAccessToken } from '../utils/jwt.js';

// Type du payload JWT injecté dans le contexte
export type AuthPayload = {
    userId: string;
    email: string;
    role: 'ADMIN' | 'USER';
    refreshTokenId: string; // ✅ Ajouter l'ID du refresh token
    organizationId?: string;
};

export const authGuard = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Token manquant' } }, 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyAccessToken(token);

    if (!payload) {
        return c.json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalide ou expiré' } }, 401);
    }

    c.set('auth', payload);
    await next();
};