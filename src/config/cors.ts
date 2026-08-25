import { env } from './env.js';

// Origines autorisées selon l'environnement
const getAllowedOrigins = (): string[] => {
    if (env.NODE_ENV === 'development') {
        return [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173', // Vite
            'http://localhost:4200', // Ng
            'http://localhost:8100', // Ionic
            'http://127.0.0.1:3000',
        ];
    }

    // Production : définir les domaines autorisés
    return process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://facturly.com',
        'https://www.facturly.com',
    ];
};

export const corsConfig = {
    // Origines autorisées
    allowedOrigins: getAllowedOrigins(),

    // Méthodes HTTP autorisées
    allowedMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],

    // Headers autorisés en requête
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Bypass-Cache',
    ],

    // Headers exposés en réponse
    exposedHeaders: [
        'X-Cache',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After',
        'Content-Length',
        'X-Total-Count',
    ],

    // Permettre les credentials (cookies, auth)
    allowCredentials: true,

    // Cache CORS en secondes
    maxAge: 86400, // 24 heures
};