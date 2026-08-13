import { z } from 'zod';

// Créer un item de facture
export const createInvoiceItemSchema = z.object({
    description: z.string().min(1, 'La description est requise'),
    quantity: z.number().int().positive('La quantité doit être positive'),
    unitPrice: z.number().int().nonnegative('Le prix unitaire doit être positif'), // FCFA
});

export type CreateInvoiceItemRequest = z.infer<typeof createInvoiceItemSchema>;

// Créer une facture
export const createInvoiceSchema = z.object({
    organizationId: z.uuid('ID d\'organisation invalide'),
    clientName: z.string().min(1, 'Le nom du client est requis'),
    clientEmail: z.email('Email invalide').optional(),
    clientAddress: z.string().optional(),
    items: z.array(createInvoiceItemSchema).min(1, 'Au moins un item est requis'),
});

export type CreateInvoiceRequest = z.infer<typeof createInvoiceSchema>;

// Réponse item
export const invoiceItemResponseSchema = z.object({
    id: z.uuid(),
    invoiceId: z.uuid(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number(),
    createdAt: z.date(),
});

export type InvoiceItemResponse = z.infer<typeof invoiceItemResponseSchema>;

// Réponse facture
export const invoiceResponseSchema = z.object({
    id: z.uuid(),
    organizationId: z.uuid(),
    number: z.string(),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']),
    clientName: z.string(),
    clientEmail: z.string().email().nullable(),
    clientAddress: z.string().nullable(),
    totalAmount: z.number(),
    issueDate: z.date(),
    paidAt: z.date().nullable(),
    items: z.array(invoiceItemResponseSchema),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type InvoiceResponse = z.infer<typeof invoiceResponseSchema>;