import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { user } from './user.schema.js';

// Un refresh token = une session, révocable indépendamment des autres
export const refreshToken = pgTable('refresh_token', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    // On stocke le hash du token, jamais le token en clair
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    userAgent: varchar('user_agent', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});