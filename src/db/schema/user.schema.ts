import { pgTable, uuid, varchar, timestamp, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userRoleEnum } from './enums.schema.js';
import { organization } from './organization.schema.js';

export const user = pgTable(
    'user',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        email: varchar('email', { length: 255 }).notNull().unique(),
        passwordHash: varchar('password_hash', { length: 255 }).notNull(),
        firstName: varchar('first_name', { length: 100 }).notNull(),
        lastName: varchar('last_name', { length: 100 }).notNull(),
        role: userRoleEnum('role').notNull().default('USER'),
        // Nullable uniquement pour un ADMIN
        organizationId: uuid('organization_id').references(() => organization.id, {
            onDelete: 'cascade',
        }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        // Contrainte DB : ADMIN => pas d'organisation, USER => organisation obligatoire
        check(
            'user_role_organization_check',
            sql`(role = 'ADMIN' AND organization_id IS NULL) OR (role = 'USER' AND organization_id IS NOT NULL)`
        ),
    ]
);