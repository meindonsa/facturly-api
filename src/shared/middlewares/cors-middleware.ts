import { Context, type Next } from 'hono';
import { corsConfig } from '../../config/cors.js';
import { sendError } from '../utils/response.js';

export const corsMiddleware = async (c: Context, next: Next) => {
    const origin = c.req.header('origin');

    // Vérifier si l'origine est autorisée
    const isOriginAllowed = origin && corsConfig.allowedOrigins.includes(origin);

    // Rejeter les origines non autorisées (sauf pour les requêtes localhost en dev)
    if (!isOriginAllowed && origin) {
        return sendError(
            c,
            'CORS_ERROR',
            `L'origine ${origin} n'est pas autorisée`,
            403
        );
    }

    // Ajouter les headers CORS
    if (origin) {
        c.header('Access-Control-Allow-Origin', origin);
    }

    c.header('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
    c.header('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    c.header('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
    c.header('Access-Control-Allow-Credentials', corsConfig.allowCredentials.toString());
    c.header('Access-Control-Max-Age', corsConfig.maxAge.toString());

    // Gérer les requêtes OPTIONS (preflight)
    if (c.req.method === 'OPTIONS') {
        return c.text('OK', 200);
    }

    await next();
};