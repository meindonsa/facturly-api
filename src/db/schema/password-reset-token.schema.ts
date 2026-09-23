import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { user } from './user.schema.js';

// Token de réinitialisation de mot de passe — usage unique, courte durée (1h)
export const passwordResetToken = pgTable('password_reset_token', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    // Hash du JWT, jamais en clair (comme refresh_token)
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
