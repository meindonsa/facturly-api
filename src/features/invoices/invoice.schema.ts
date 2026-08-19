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
    deliveryAmount: z.number().int().nonnegative('Les frais de livraison doivent être positifs').default(0), // ✅ Ajouter
    clientPhone: z.string().optional(),
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
    clientEmail: z.email().nullable(),
    clientAddress: z.string().nullable(),
    clientPhone: z.string().nullable(),
    totalProduct: z.number(), // ✅ Ajouter
    totalProductAmount: z.number(), // ✅ Ajouter
    deliveryAmount: z.number(), // ✅ Ajouter
    totalAmount: z.number(),
    issueDate: z.date(),
    paidAt: z.date().nullable(),
    items: z.array(invoiceItemResponseSchema),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type InvoiceResponse = z.infer<typeof invoiceResponseSchema>;

// Mettre à jour un item (avec ou sans ID)
export const updateInvoiceItemSchema = z.object({
    id: z.uuid().optional(), // Si présent = mise à jour, sinon = création
    description: z.string().min(1, 'La description est requise'),
    quantity: z.number().int().positive('La quantité doit être positive'),
    unitPrice: z.number().int().nonnegative('Le prix unitaire doit être positif'),
});

export type UpdateInvoiceItemRequest = z.infer<typeof updateInvoiceItemSchema>;

// Mettre à jour une facture (items + montant livraison)
export const updateInvoiceSchema = z.object({
    clientName: z.string().min(1, 'Le nom du client est requis').optional(),
    clientEmail: z.email('Email invalide').optional(),
    clientPhone: z.string().optional(),
    clientAddress: z.string().optional(),
    deliveryAmount: z.number().int().nonnegative('Les frais de livraison doivent être positifs').optional(),
    items: z.array(updateInvoiceItemSchema).min(1, 'Au moins un item est requis'),
    deleteItemIds: z.array(z.uuid()).optional().default([]), // IDs des items à supprimer
});

export type UpdateInvoiceRequest = z.infer<typeof updateInvoiceSchema>;


// Marquer comme payée
export const markInvoiceAsPaidSchema = z.object({
    // Vide, juste pour confirmer l'action
});

export type MarkInvoiceAsPaidRequest = z.infer<typeof markInvoiceAsPaidSchema>;

// Annuler une facture
export const cancelInvoiceSchema = z.object({
    // Vide, juste pour confirmer l'action
});

export type CancelInvoiceRequest = z.infer<typeof cancelInvoiceSchema>;