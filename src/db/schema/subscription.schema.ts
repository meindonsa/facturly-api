import { pgTable, uuid, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { organization } from './organization.schema.js';
import {user} from "./user.schema.js";

// Trace simplement : quelle organisation a payé, à quelle date, et jusqu'à quand.
// Un abonnement dure toujours 12 mois. Un cron pourra plus tard comparer expiresAt
// à la date du jour pour désactiver automatiquement les organisations expirées.
export const subscription = pgTable('subscription', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').notNull().references(() => organization.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'set null' }), // ✅ Le user qui a créé/demandé l'abonnement
    // Montant payé, en FCFA entier
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('XAF'),
    // Date du paiement
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
    // paidAt + 12 mois, calculée côté service au moment de l'insertion
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});