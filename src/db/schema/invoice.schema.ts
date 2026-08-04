import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { invoiceStatusEnum } from './enums.schema.js';
import { organization } from './organization.schema.js';

// Numérotation FAC-YYYYMMDD-XXXX générée côté service, pas en DB
export const invoice = pgTable('invoice', {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
        .notNull()
        .references(() => organization.id, { onDelete: 'cascade' }),
    number: varchar('number', { length: 50 }).notNull().unique(),
    status: invoiceStatusEnum('status').notNull().default('DRAFT'),
    clientName: varchar('client_name', { length: 255 }).notNull(),
    clientEmail: varchar('client_email', { length: 255 }),
    clientAddress: varchar('client_address', { length: 500 }),
    // FCFA entier, pas de décimales
    totalAmount: integer('total_amount').notNull().default(0),
    issueDate: timestamp('issue_date', { withTimezone: true }).notNull().defaultNow(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});