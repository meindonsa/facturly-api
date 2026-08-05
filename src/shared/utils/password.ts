import { hash, verify } from 'argon2';

export const hashPassword = async (password: string): Promise<string> => {
    return hash(password, {
        type: 2, // argon2id
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
    });
};

export const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
    try {
        return await verify(passwordHash, password);
    } catch {
        return false;
    }
};