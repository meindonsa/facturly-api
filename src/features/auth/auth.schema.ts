import { z } from 'zod';

// Register ADMIN : pas d'organisation
export const registerAdminSchema = z.object({
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
});

export type RegisterAdminRequest = z.infer<typeof registerAdminSchema>;

// Register USER : organisationId obligatoire
export const registerUserSchema = z.object({
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    organizationId: z.uuid('ID d\'organisation invalide'),
});

export type RegisterUserRequest = z.infer<typeof registerUserSchema>;

export const registerResponseSchema = z.object({
    id: z.uuid(),
    email: z.email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['ADMIN', 'USER']),
    organizationId: z.uuid().nullable(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

export const loginSchema = z.object({
    email: z.email('Email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis'),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Le refresh token est requis'),
});

export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

export const authResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
        id: z.uuid(),
        email: z.email(),
        firstName: z.string(),
        lastName: z.string(),
        role: z.enum(['ADMIN', 'USER']),
        organizationId: z.uuid().nullable(),
    }),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;