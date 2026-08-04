import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { logLevelEnum } from './enums.schema.js';
import { organization } from './organization.schema.js';
import { user } from './user.schema.js';

// organizationId/userId nullable : actions ADMIN ou système sans user/org rattaché
export const log = pgTable('log', {
    id: uuid('id').defaultRandom().primaryKey(),
    level: logLevelEnum('level').notNull().default('INFO'),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: uuid('entity_id'),
    message: varchar('message', { length: 1000 }),
    metadata: jsonb('metadata'),
    organizationId: uuid('organization_id').references(() => organization.id, {
        onDelete: 'set null',
    }),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});