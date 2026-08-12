import { z } from 'zod';

// Créer une nouvelle organisation (admin only)
export const createOrganizationSchema = z.object({
    name: z.string().min(1, 'Le nom de l\'organisation est requis'),
    email: z.email('Email invalide').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export type CreateOrganizationRequest = z.infer<typeof createOrganizationSchema>;

// Mettre à jour les infos de l'organisation
export const updateOrganizationInfoSchema = z.object({
    name: z.string().min(1, 'Le nom de l\'organisation est requis').optional(),
    email: z.email('Email invalide').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

export type UpdateOrganizationInfoRequest = z.infer<typeof updateOrganizationInfoSchema>;

// Changer le statut (admin only)
export const updateOrganizationStatusSchema = z.object({
    status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] , {
        message: 'Statut invalide'
    }),
});

export type UpdateOrganizationStatusRequest = z.infer<typeof updateOrganizationStatusSchema>;

// Réponse organisation
export const organizationResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE']),
    email: z.email().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    logoUrl: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;

// Query parameters pour la liste
export const listOrganizationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(), // Recherche par nom ou email
});

export type ListOrganizationsQuery = z.infer<typeof listOrganizationsQuerySchema>;

// Réponse paginée
export const paginatedOrganizationsSchema = z.object({
    data: z.array(organizationResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

export type PaginatedOrganizationsResponse = z.infer<typeof paginatedOrganizationsSchema>;