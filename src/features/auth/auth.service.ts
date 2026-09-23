import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { user, refreshToken, passwordResetToken } from '../../db/schema/index.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateResetToken,
    verifyResetToken,
} from '../../shared/utils/jwt.js';
import { env } from '../../config/env.js';
import { getEmailService } from '../../shared/services/email.service.js';
import type {
    AuthResponse,
    LoginRequest,
    RegisterAdminRequest,
    RegisterResponse, RegisterUserRequest
} from "./auth.schema.js";

export class AuthService {
    static async registerAdmin(req: RegisterAdminRequest): Promise<RegisterResponse> {
        const { email, password, firstName, lastName } = req;

        // Vérifier que l'email n'existe pas déjà
        const existing = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (existing.length > 0) {
            throw new Error('Cet email est déjà utilisé');
        }

        const passwordHash = await hashPassword(password);

        const newUser = await db
            .insert(user)
            .values({
                email,
                passwordHash,
                firstName,
                lastName,
                role: 'ADMIN',
                organizationId: null,
            })
            .returning();

        const createdUser = newUser[0];

        return {
            id: createdUser.id,
            email: createdUser.email,
            firstName: createdUser.firstName,
            lastName: createdUser.lastName,
            role: createdUser.role as 'ADMIN' | 'USER',
            organizationId: createdUser.organizationId,
        };
    }

    // Créer un nouvel USER rattaché à une organisation
    static async registerUser(req: RegisterUserRequest): Promise<RegisterResponse> {
        const { email, password, firstName, lastName, organizationId } = req;

        // Vérifier que l'email n'existe pas déjà
        const existing = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (existing.length > 0) {
            throw new Error('Cet email est déjà utilisé');
        }

        const passwordHash = await hashPassword(password);

        const newUser = await db
            .insert(user)
            .values({
                email,
                passwordHash,
                firstName,
                lastName,
                role: 'USER',
                organizationId,
            })
            .returning();

        const createdUser = newUser[0];

        return {
            id: createdUser.id,
            email: createdUser.email,
            firstName: createdUser.firstName,
            lastName: createdUser.lastName,
            role: createdUser.role as 'ADMIN' | 'USER',
            organizationId: createdUser.organizationId,
        };
    }

    // Connexion utilisateur (login)
    static async login(req: LoginRequest): Promise<AuthResponse> {
        const { email, password } = req;

        const users = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (users.length === 0) {
            throw new Error('Email ou mot de passe incorrect');
        }

        const foundUser = users[0];

        const passwordValid = await verifyPassword(password, foundUser.passwordHash);
        if (!passwordValid) {
            throw new Error('Email ou mot de passe incorrect');
        }

        const refreshTokenValue = await this.createRefreshToken(foundUser.id);
        const accessToken = await generateAccessToken({
            userId: foundUser.id,
            email: foundUser.email,
            role: foundUser.role as 'ADMIN' | 'USER',
            refreshTokenId: refreshTokenValue.id,
            organizationId: foundUser.organizationId || undefined,
        });


        return {
            accessToken,
            refreshToken: refreshTokenValue.jwt,
            user: {
                id: foundUser.id,
                email: foundUser.email,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                role: foundUser.role as 'ADMIN' | 'USER',
                organizationId: foundUser.organizationId,
            },
        };
    }

    static async refreshAccessToken(refreshTokenValue: string): Promise<AuthResponse> {
        const payload = await verifyRefreshToken(refreshTokenValue);
        if (!payload) {
            throw new Error('Le refresh token est invalide ou expiré');
        }

        const tokens = await db
            .select()
            .from(refreshToken)
            .where(eq(refreshToken.id, payload.refreshTokenId))
            .limit(1);

        if (tokens.length === 0) {
            throw new Error('Le refresh token n\'existe pas en base');
        }

        const token = tokens[0];

        if (new Date() > token.expiresAt) {
            throw new Error('Le refresh token a expiré');
        }

        if (token.revokedAt) {
            throw new Error('Le refresh token a été révoqué');
        }

        const users = await db
            .select()
            .from(user)
            .where(eq(user.id, payload.userId))
            .limit(1);

        if (users.length === 0) {
            throw new Error('L\'utilisateur n\'existe pas');
        }

        const foundUser = users[0];

        const newAccessToken = await generateAccessToken({
            userId: foundUser.id,
            email: foundUser.email,
            role: foundUser.role as 'ADMIN' | 'USER',
            refreshTokenId: payload.refreshTokenId,
            organizationId: foundUser.organizationId || undefined,
        });

        return {
            accessToken: newAccessToken,
            refreshToken: refreshTokenValue,
            user: {
                id: foundUser.id,
                email: foundUser.email,
                firstName: foundUser.firstName,
                lastName: foundUser.lastName,
                role: foundUser.role as 'ADMIN' | 'USER',
                organizationId: foundUser.organizationId,
            },
        };
    }

    private static async createRefreshToken(userId: string): Promise<{ id: string; jwt: string }> {
        const tokenId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const refreshTokenValue = await generateRefreshToken({
            userId,
            refreshTokenId: tokenId,
        });

        const tokenHash = await hashPassword(refreshTokenValue);

        await db.insert(refreshToken).values({
            id: tokenId,
            userId,
            tokenHash,
            expiresAt,
        });

        return { id: tokenId, jwt: refreshTokenValue };
    }

    // Révoquer un refresh token (logout)
    static async logout(refreshTokenValue: string): Promise<void> {
        const payload = await verifyRefreshToken(refreshTokenValue);
        if (!payload) {
            throw new Error('Le refresh token est invalide ou expiré');
        }

        // Chercher le refresh token en DB
        const tokens = await db
            .select()
            .from(refreshToken)
            .where(eq(refreshToken.id, payload.refreshTokenId))
            .limit(1);

        if (tokens.length === 0) {
            throw new Error('Le refresh token n\'existe pas');
        }
        await db
            .update(refreshToken)
            .set({ revokedAt: new Date() })
            .where(eq(refreshToken.id, payload.refreshTokenId));
    }

    static async logoutByRefreshTokenId(refreshTokenId: string): Promise<void> {
        const tokens = await db
            .select()
            .from(refreshToken)
            .where(eq(refreshToken.id, refreshTokenId))
            .limit(1);

        if (tokens.length === 0) {
            throw new Error('Le refresh token n\'existe pas en base');
        }

        await db
            .update(refreshToken)
            .set({ revokedAt: new Date() })
            .where(eq(refreshToken.id, refreshTokenId));
    }

    // Demande de réinitialisation — toujours 200 pour ne pas révéler l'existence de l'email (techwatch)
    static async forgotPassword(email: string): Promise<void> {
        const users = await db.select().from(user).where(eq(user.email, email)).limit(1);

        if (users.length === 0) {
            return;
        }

        const foundUser = users[0];

        // Invalider les anciens tokens de reset
        await db.delete(passwordResetToken).where(eq(passwordResetToken.userId, foundUser.id));

        const resetTokenId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1h comme JWT_RESET_EXPIRES_IN

        const resetToken = await generateResetToken({
            userId: foundUser.id,
            email: foundUser.email,
            resetTokenId,
            type: 'reset',
        });

        const tokenHash = await hashPassword(resetToken);

        await db.insert(passwordResetToken).values({
            id: resetTokenId,
            userId: foundUser.id,
            tokenHash,
            expiresAt,
        });

        // Envoi email via notisend (identique à techwatch), silencieux si non configuré
        if (!env.FRONTEND_URL) {
            console.error('FRONTEND_URL not configured, cannot send reset email');
            return;
        }

        const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const emailService = getEmailService();
        if (!emailService) {
            console.warn('Mail service not configured, reset link generated but not sent:', resetLink);
            return;
        }

        try {
            await emailService.sendPasswordResetEmail(foundUser.email, resetLink);
        } catch (e) {
            console.error('Failed to send password reset email:', e);
        }
    }

    static async resetPassword(token: string, newPassword: string): Promise<void> {
        const payload = await verifyResetToken(token);
        if (!payload) {
            throw new Error('Lien invalide ou expiré');
        }

        const tokens = await db
            .select()
            .from(passwordResetToken)
            .where(eq(passwordResetToken.id, payload.resetTokenId))
            .limit(1);

        if (tokens.length === 0) {
            throw new Error('Lien invalide ou expiré');
        }

        const stored = tokens[0];

        if (new Date() > stored.expiresAt) {
            throw new Error('Lien invalide ou expiré');
        }

        // Vérifier que le hash correspond (argon2) — protection si DB leakée
        const hashValid = await verifyPassword(token, stored.tokenHash);
        if (!hashValid) {
            throw new Error('Lien invalide ou expiré');
        }

        const users = await db.select().from(user).where(eq(user.id, payload.userId)).limit(1);

        if (users.length === 0 || users[0].email !== payload.email) {
            throw new Error('Lien invalide ou expiré');
        }

        const newHash = await hashPassword(newPassword);
        await db.update(user).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(user.id, payload.userId));

        // Invalider le token utilisé + tous les anciens
        await db.delete(passwordResetToken).where(eq(passwordResetToken.id, payload.resetTokenId));

        // Forcer reconnexion : révoquer tous les refresh tokens de l'utilisateur
        await db.update(refreshToken).set({ revokedAt: new Date() }).where(eq(refreshToken.userId, payload.userId));
    }
}