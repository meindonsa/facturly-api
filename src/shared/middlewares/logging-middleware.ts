import { Context, type Next } from 'hono';
import { Logger } from '../utils/logger.js';
import {invalidateCache} from "../utils/cache-invalidator.js";

// Mapper les actions selon la méthode HTTP et le path
function getActionFromRequest(c: Context): { action: string; entityType?: string } {
    const method = c.req.method;
    const path = c.req.path;

    // Invoices
    if (path.includes('/invoices')) {
        if (method === 'POST') return { action: 'CREATE_INVOICE', entityType: 'invoice' };
        if (method === 'PATCH' && path.includes('/paid')) return { action: 'MARK_INVOICE_PAID', entityType: 'invoice' };
        if (method === 'PATCH' && path.includes('/cancel')) return { action: 'CANCEL_INVOICE', entityType: 'invoice' };
        if (method === 'PATCH') return { action: 'UPDATE_INVOICE', entityType: 'invoice' };
        if (method === 'DELETE') return { action: 'DELETE_INVOICE', entityType: 'invoice' };
        if (method === 'GET') return { action: 'GET_INVOICE', entityType: 'invoice' };
    }

    // Organizations
    if (path.includes('/organizations')) {
        if (method === 'POST') return { action: 'CREATE_ORGANIZATION', entityType: 'organization' };
        if (method === 'PATCH' && path.includes('/status')) return { action: 'UPDATE_ORG_STATUS', entityType: 'organization' };
        if (method === 'PATCH' && path.includes('/logo')) return { action: 'UPDATE_ORG_LOGO', entityType: 'organization' };
        if (method === 'PATCH') return { action: 'UPDATE_ORGANIZATION', entityType: 'organization' };
        if (method === 'GET') return { action: 'GET_ORGANIZATION', entityType: 'organization' };
    }

    // Users
    if (path.includes('/users')) {
        if (method === 'POST') return { action: 'CREATE_ADMIN', entityType: 'user' };
        if (method === 'PATCH' && path.includes('/deactivate')) return { action: 'DEACTIVATE_USER', entityType: 'user' };
        if (method === 'DELETE') return { action: 'DELETE_USER', entityType: 'user' };
        if (method === 'GET') return { action: 'GET_USERS', entityType: 'user' };
    }

    // Subscriptions
    if (path.includes('/subscriptions')) {
        if (method === 'POST') return { action: 'CREATE_SUBSCRIPTION', entityType: 'subscription' };
        if (method === 'GET') return { action: 'GET_SUBSCRIPTION', entityType: 'subscription' };
    }

    // Auth
    if (path.includes('/auth')) {
        if (method === 'POST' && path.includes('/register')) return { action: 'REGISTER_USER', entityType: 'user' };
        if (method === 'POST' && path.includes('/login')) return { action: 'LOGIN', entityType: 'user' };
        if (method === 'POST' && path.includes('/logout')) return { action: 'LOGOUT', entityType: 'user' };
        if (method === 'POST' && path.includes('/refresh')) return { action: 'REFRESH_TOKEN', entityType: 'user' };
    }

    return { action: `${method} ${path}` };
}

// Middleware de logging automatique
export const loggingMiddleware = async (c: Context, next: Next) => {
    const auth = c.get('auth') as any;
    const { action, entityType } = getActionFromRequest(c);
    const logger = new Logger({
        userId: auth?.userId,
        organizationId: auth?.organizationId,
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown',
    });

    const startTime = Date.now();

    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;

    // ✅ Vérifier le status HTTP pour déterminer succès ou erreur
    if (status >= 400) {
        // Erreur
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
            // Si parsing échoue, log générique
            await logger.error(action, {
                entityType,
                message: `Erreur HTTP ${status}`,
                metadata: { duration, status },
            });
        }
    } else {
        // Succès
        await logger.info(action, {
            entityType,
            message: `${action} exécuté avec succès (${duration}ms)`,
            metadata: { duration, status },
        });
        invalidateCache(action, entityType);
    }
};