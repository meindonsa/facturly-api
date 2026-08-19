import { z } from 'zod';

// Créer un abonnement
export const createSubscriptionSchema = z.object({
    organizationId: z.uuid('ID d\'organisation invalide'),
    userId: z.uuid('ID d\'utilisateur invalide'),
    amount: z.number().int().positive('Le montant doit être positif'),
    currency: z.string().length(3).default('XAF'),
});

export type CreateSubscriptionRequest = z.infer<typeof createSubscriptionSchema>;

// Réponse abonnement
export const subscriptionResponseSchema = z.object({
    id: z.uuid(),
    organization: z.object({
        id: z.uuid(),
        name: z.string(),
    }),
    user: z.object({
        id: z.uuid(),
        fullName: z.string(), // firstName + lastName
    }),
    amount: z.number(),
    currency: z.string(),
    paidAt: z.date(),
    expiresAt: z.date(),
    isActive: z.boolean(),
    createdAt: z.date(),
});

export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;

// Query parameters pour la liste
export const listSubscriptionsQuerySchema = z.object({
    page: z.coerce.number().default(1).pipe(z.number().int().positive()),
    limit: z.coerce.number().default(10).pipe(z.number().int().positive().max(100)),
    organizationId: z.uuid().optional(), // Filtrer par organisation
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(), // Filtrer actifs/inactifs
});

export type ListSubscriptionsQuery = z.infer<typeof listSubscriptionsQuerySchema>;

// Réponse paginée
export const paginatedSubscriptionsSchema = z.object({
    data: z.array(subscriptionResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

export type PaginatedSubscriptionsResponse = z.infer<typeof paginatedSubscriptionsSchema>;