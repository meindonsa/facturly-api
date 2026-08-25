import { z } from 'zod';

// Créer un log
export const createLogSchema = z.object({
    level: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).default('INFO'),
    action: z.string().min(1, 'L\'action est requise'),
    entityType: z.string().optional(),
    entityId: z.uuid().optional(),
    message: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    organizationId: z.uuid().optional(),
    userId: z.uuid().optional(),
    ipAddress: z.string().optional(),
});

export type CreateLogRequest = z.infer<typeof createLogSchema>;

// Réponse log
export const logResponseSchema = z.object({
    id: z.uuid(),
    level: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
    action: z.string(),
    entityType: z.string().nullable(),
    entityId: z.uuid().nullable(),
    message: z.string().nullable(),
    metadata: z.record(z.string(), z.any()).nullable(),
    organizationId: z.uuid().nullable(),
    userId: z.uuid().nullable(),
    ipAddress: z.string().nullable(),
    createdAt: z.date(),
});

export type LogResponse = z.infer<typeof logResponseSchema>;

// Query parameters pour la liste
export const listLogsQuerySchema = z.object({
    page: z.coerce.number().default(1).pipe(z.number().int().positive()),
    limit: z.coerce.number().default(10).pipe(z.number().int().positive().max(100)),
    level: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
    action: z.string().optional(),
    organizationId: z.uuid().optional(),
    userId: z.uuid().optional(),
    entityType: z.string().optional(),
});

export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;

// Réponse paginée
export const paginatedLogsSchema = z.object({
    data: z.array(logResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
});

export type PaginatedLogsResponse = z.infer<typeof paginatedLogsSchema>;