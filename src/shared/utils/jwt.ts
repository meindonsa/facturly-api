import { SignJWT, jwtVerify } from 'jose';
import { env } from '../../config/env.js';

type AccessTokenPayload = {
    userId: string;
    email: string;
    role: 'ADMIN' | 'USER';
    organizationId?: string;
};

type RefreshTokenPayload = {
    userId: string;
    refreshTokenId: string;
};

const accessKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshKey = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export const generateAccessToken = async (payload: AccessTokenPayload): Promise<string> => {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
        .sign(accessKey);
};

export const generateRefreshToken = async (payload: RefreshTokenPayload): Promise<string> => {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
        .sign(refreshKey);
};

export const verifyAccessToken = async (token: string): Promise<AccessTokenPayload | null> => {
    try {
        const verified = await jwtVerify(token, accessKey);
        return verified.payload as AccessTokenPayload;
    } catch {
        return null;
    }
};

export const verifyRefreshToken = async (token: string): Promise<RefreshTokenPayload | null> => {
    try {
        const verified = await jwtVerify(token, refreshKey);
        return verified.payload as RefreshTokenPayload;
    } catch {
        return null;
    }
};