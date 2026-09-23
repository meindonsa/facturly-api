import 'dotenv/config';
import { z } from 'zod';

// Validation stricte des variables d'environnement : le serveur ne démarre pas si une est manquante ou invalide
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),

    // Connexion Postgres (Neon)
    NEON_DATABASE_URL: z.url(),

    // Secrets JWT — access courte durée, refresh longue durée, reset 1h
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET doit faire au moins 32 caractères'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET doit faire au moins 32 caractères'),
    JWT_RESET_SECRET: z.string().min(32, 'JWT_RESET_SECRET doit faire au moins 32 caractères').optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    JWT_RESET_EXPIRES_IN: z.string().default('1h'),
    ALLOWED_ORIGINS: z.string().optional(), // ✅ Ajouter (format : "https://domain1.com,https://domain2.com")

    // Frontend pour lien reset
    FRONTEND_URL: z.url().optional(),

    // Mail Service (notisend) — optionnel en dev/test
    MAIL_SERVICE_URL: z.url().optional(),
    MAIL_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    // On affiche clairement les variables manquantes/invalides et on arrête le process
    console.error('❌ Variables d\'environnement invalides :');
    console.error(z.treeifyError(parsed.error));
    process.exit(1);
}

export const env = parsed.data;