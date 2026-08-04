import 'dotenv/config';
import { z } from 'zod';

// Validation stricte des variables d'environnement : le serveur ne démarre pas si une est manquante ou invalide
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),

    // Connexion Postgres (Supabase utilisé uniquement comme base de données)
    DATABASE_URL: z.url(),

    // Secrets JWT — access token courte durée, refresh token longue durée
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET doit faire au moins 32 caractères'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET doit faire au moins 32 caractères'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    // On affiche clairement les variables manquantes/invalides et on arrête le process
    console.error('❌ Variables d\'environnement invalides :');
    console.error(z.treeifyError(parsed.error));
    process.exit(1);
}

export const env = parsed.data;