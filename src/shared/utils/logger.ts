import { LogService } from '../../features/logs/log.service.js';

type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface LoggerContext {
    userId?: string;
    organizationId?: string;
    ipAddress?: string;
}

export class Logger {
    private context: LoggerContext;

    constructor(context: LoggerContext = {}) {
        this.context = context;
    }

    async log(
        action: string,
        level: LogLevel = 'INFO',
        options?: {
            message?: string;
            entityType?: string;
            entityId?: string;
            metadata?: Record<string, any>;
        }
    ): Promise<void> {
        try {
            await LogService.createLog({
                level,
                action,
                entityType: options?.entityType,
                entityId: options?.entityId,
                message: options?.message,
                metadata: options?.metadata,
                organizationId: this.context.organizationId,
                userId: this.context.userId,
                ipAddress: this.context.ipAddress,
            });
        } catch (error) {
            // Ne pas faire crasher l'app si le logging échoue
            console.error('Erreur lors du logging:', error);
        }
    }

    async info(action: string, options?: any): Promise<void> {
        await this.log(action, 'INFO', options);
    }

    async warning(action: string, options?: any): Promise<void> {
        await this.log(action, 'WARNING', options);
    }

    async error(action: string, options?: any): Promise<void> {
        await this.log(action, 'ERROR', options);
    }

    async critical(action: string, options?: any): Promise<void> {
        await this.log(action, 'CRITICAL', options);
    }
}

// Helper pour créer un logger depuis un contexte Hono
export function createLogger(c: any): Logger {
    const auth = c.get('auth');
    const ipAddress = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

    return new Logger({
        userId: auth?.userId,
        organizationId: auth?.organizationId,
        ipAddress,
    });
}