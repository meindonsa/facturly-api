import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import * as schema from '../db/schema/index.js';

// Client postgres.js : une seule connexion pool partagée dans toute l'app
const client = postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

// Instance Drizzle typée avec notre schéma complet (users, organization, invoice, etc.)
export const db = drizzle(client, { schema });

// Utile pour un shutdown propre (SIGTERM) ou pour les tests
export const closeDb = async () => {
    await client.end();
};