import {Context, type Next} from 'hono';
import { sendError } from '../utils/response.js';

export const errorHandler = async (c: Context, next: Next) => {
    try {
        await next();
    } catch (error) {
        console.error('🔴 Erreur non capturée :', error);

        const message = error instanceof Error ? error.message : 'Erreur serveur interne';
        return sendError(c, 'INTERNAL_ERROR', message, 500);
    }
};