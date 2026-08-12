import { Context } from 'hono';
import type { AuthPayload } from '../middlewares/auth-guard.js';

export type AppContext = Context & {
    Variables: {
        auth: AuthPayload;
    };
};