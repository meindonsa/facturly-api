import { z } from 'zod';

// Créer un admin
export const createAdminSchema = z.object({
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
});

export type CreateAdminRequest = z.infer<typeof createAdminSchema>;

// Query parameters pour la liste
export const listUsersQuerySchema = z.object({
    page: z.coerce.number().default(1).pipe(z.number().int().positive()),
    limit: z.coerce.number().default(10).pipe(z.number().int().positive().max(100)),
    search: z.string().optional(), // Recherche par email, firstName ou lastName
    role: z.enum(['ADMIN', 'USER']).optional(), // Filtrer par rôle
    organizationId: z.uuid().optional(), // Filtrer par organisation (admins only)
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional(), // Filtrer actifs/inactifs
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// Réponse utilisateur (pour les USERs, inclure l'organisation)
export const userResponseSchema = z.object({
    id: z.uuid(),
    email: z.email(),
    firstName: z.string(),
    lastName: z.string(),
    fullName: z.string(),
    role: z.enum(['ADMIN', 'USER']),
    organization: z.object({
        id: z.uuid(),
        name: z.string(),
    }).nullable(), // null pour les ADMINs
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

// Réponse paginée
export const paginatedUsersSchema = z.object({
    data: z.array(userResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

export type PaginatedUsersResponse = z.infer<typeof paginatedUsersSchema>;