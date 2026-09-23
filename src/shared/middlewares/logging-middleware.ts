import { Context, type Next } from 'hono';
import { Logger } from '../utils/logger.js';
import {invalidateCache} from "../utils/cache-invalidator.js";

// Mapper les actions — uniquement auth/* et user/*
function getActionFromRequest(c: Context): { action: string; entityType?: string } {
    const method = c.req.method;
    const path = c.req.path;

    // Auth
    if (path.includes('/auth')) {
        if (method === 'POST' && path.includes('/register')) return { action: 'REGISTER_USER', entityType: 'user' };
        if (method === 'POST' && path.includes('/login')) return { action: 'LOGIN', entityType: 'user' };
        if (method === 'POST' && path.includes('/logout')) return { action: 'LOGOUT', entityType: 'user' };
        if (method === 'POST' && path.includes('/refresh')) return { action: 'REFRESH_TOKEN', entityType: 'user' };
        if (method === 'POST' && path.includes('/forgot-password')) return { action: 'FORGOT_PASSWORD', entityType: 'user' };
        if (method === 'POST' && path.includes('/reset-password')) return { action: 'RESET_PASSWORD', entityType: 'user' };
        return { action: `${method} ${path}`, entityType: 'user' };
    }

    // Users
    if (path.includes('/users')) {
        if (method === 'POST') return { action: 'CREATE_ADMIN', entityType: 'user' };
        if (method === 'PATCH' && path.includes('/deactivate')) return { action: 'DEACTIVATE_USER', entityType: 'user' };
        if (method === 'DELETE') return { action: 'DELETE_USER', entityType: 'user' };
        if (method === 'GET') return { action: 'GET_USERS', entityType: 'user' };
        return { action: `${method} ${path}`, entityType: 'user' };
    }

    return { action: `${method} ${path}` };
}

const isAuthOrUserRoute = (path: string): boolean => path.includes('/auth') || path.includes('/users');

// Middleware de logging — uniquement erreurs (tous) + succès sur auth/* et user/*
export const loggingMiddleware = async (c: Context, next: Next) => {
    const auth = c.get('auth') as any;
    const { action, entityType } = getActionFromRequest(c);
    const path = c.req.path;
    const logger = new Logger({
        userId: auth?.userId,
        organizationId: auth?.organizationId,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
    });

    const startTime = Date.now();

    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;

    if (status >= 400) {
        // Erreur — toujours loggé quel que soit le path
        try {
            const responseText = await c.res.clone().text();
            const responseData = JSON.parse(responseText);
            const errorMessage = responseData?.error?.message || 'Erreur HTTP';

            await logger.error(action, {
                entityType,
                message: errorMessage,
                metadata: { duration, status },
            });
        } catch {
            await logger.error(action, {
                entityType,
                message: `Erreur HTTP ${status}`,
                metadata: { duration, status },
            });
        }
        return;
    }

    // Succès — uniquement auth/* et user/*
    if (!isAuthOrUserRoute(path)) {
        return;
    }

    await logger.info(action, {
        entityType,
        message: `${action} exécuté avec succès (${duration}ms)`,
        metadata: { duration, status },
    });
    invalidateCache(action, entityType);
};