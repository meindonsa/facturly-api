import { eq, and, ilike, count } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { log } from '../../db/schema/index.js';
import type { CreateLogRequest, LogResponse } from './log.schema.js';

export class LogService {
    // Créer un log
    static async createLog(req: CreateLogRequest): Promise<LogResponse> {
        const newLog = await db
            .insert(log)
            .values({
                level: (req.level || 'INFO') as any,
                action: req.action,
                entityType: req.entityType || null,
                entityId: req.entityId || null,
                message: req.message || null,
                metadata: req.metadata || null,
                organizationId: req.organizationId || null,
                userId: req.userId || null,
                ipAddress: req.ipAddress || null,
            })
            .returning();

        return this.mapToResponse(newLog[0]);
    }

    // Récupérer les logs avec filtres (admin only)
    static async listLogs(
        page: number,
        limit: number,
        level?: string,
        action?: string,
        organizationId?: string,
        userId?: string,
        entityType?: string
    ): Promise<{ data: LogResponse[]; total: number }> {
        const conditions: any[] = [];

        if (level) {
            conditions.push(eq(log.level, level as any));
        }

        if (action) {
            conditions.push(ilike(log.action, `%${action}%`));
        }

        if (organizationId) {
            conditions.push(eq(log.organizationId, organizationId));
        }

        if (userId) {
            conditions.push(eq(log.userId, userId));
        }

        if (entityType) {
            conditions.push(ilike(log.entityType, `%${entityType}%`));
        }

        const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

        // Récupérer le total
        const totalResult = await db
            .select({ count: count() })
            .from(log)
            .where(whereCondition);

        const total = totalResult[0]?.count || 0;

        // Récupérer les logs
        const offset = (page - 1) * limit;
        const logs = await db
            .select()
            .from(log)
            .where(whereCondition)
            .orderBy(log.createdAt)
            .limit(limit)
            .offset(offset);

        return {
            data: logs.map((l) => this.mapToResponse(l)),
            total,
        };
    }

    // Mapper une row vers une réponse typée
    private static mapToResponse(l: any): LogResponse {
        return {
            id: l.id,
            level: l.level,
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId,
            message: l.message,
            metadata: l.metadata,
            organizationId: l.organizationId,
            userId: l.userId,
            ipAddress: l.ipAddress,
            createdAt: l.createdAt,
        };
    }
}