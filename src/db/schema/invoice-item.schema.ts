import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { invoice } from './invoice.schema.js';

export const invoiceItem = pgTable('invoice_item', {
    id: uuid('id').defaultRandom().primaryKey(),
    invoiceId: uuid('invoice_id')
        .notNull()
        .references(() => invoice.id, { onDelete: 'cascade' }),
    description: varchar('description', { length: 500 }).notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: integer('unit_price').notNull().default(0),
    totalPrice: integer('total_price').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});