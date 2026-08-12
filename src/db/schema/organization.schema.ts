import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { organizationStatusEnum } from './enums.schema.js';

// Une organisation peut avoir plusieurs users et paie l'abonnement
export const organization = pgTable('organization', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    status: organizationStatusEnum('status').notNull().default('PENDING'),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    address: varchar('address', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});