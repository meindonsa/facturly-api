import { Context } from 'hono';

type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    timestamp: string;
};

export const sendSuccess = <T>(c: Context, data: T, status: number = 200) => {
    return c.json<ApiResponse<T>>(
        {
            success: true,
            data,
            timestamp: new Date().toISOString(),
        },
        status as any // ✅ Cast en any pour éviter le problème de typage Hono
    );
};

export const sendError = (c: Context, code: string, message: string, status: number = 400) => {
    return c.json<ApiResponse<null>>(
        {
            success: false,
            error: {
                code,
                message,
            },
            timestamp: new Date().toISOString(),
        },
        status as any // ✅ Cast en any
    );
};