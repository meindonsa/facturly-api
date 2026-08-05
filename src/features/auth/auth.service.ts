import { eq, and } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { user, refreshToken } from '../../db/schema/index.js';
import { hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt.js';
import type {AuthResponse, LoginRequest, RegisterRequest} from "./auth.schema.js";

export class AuthService {
    static async register(req: RegisterRequest): Promise<void> {
        const { email, password, firstName, lastName, organizationId } = req;

        const existing = await db
            .select()
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (existing.length > 0) {
            throw new Error('Cet email est déjà utilisé');
        }

        const role = organizationId ? 'USER' : 'ADMIN';

        const passwordHash = await hashPassword(password);

        await db
            .insert(user)
            .values({
                email,
                passwordHash,
                firstName,
                lastName,
                role,
                organizationId: organizationId || null,
            })
            .returning();
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

        const accessToken = await generateAccessToken({
            userId: foundUser.id,
            email: foundUser.email,
            role: foundUser.role as 'ADMIN' | 'USER',
            organizationId: foundUser.organizationId || undefined,
        });

        const refreshTokenValue = await this.createRefreshToken(foundUser.id);

        return {
            accessToken,
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

    private static async createRefreshToken(userId: string): Promise<string> {
        const tokenId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours

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

        return refreshTokenValue;
    }
}