import { eq, and, count, gt, lt } from 'drizzle-orm';
import { db } from '../../config/db.js';
import {subscription, organization, user} from '../../db/schema/index.js';
import type {
    CreateSubscriptionRequest,
    SubscriptionResponse,
} from './subscription.schema.js';

export class SubscriptionService {

    static async createSubscription(req: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
        const { organizationId, userId, amount, currency = 'XAF' } = req;

        // Vérifier que l'organisation existe
        const orgs = await db.select().from(organization).where(eq(organization.id, organizationId)).limit(1);

        if (orgs.length === 0) {
            throw new Error('L\'organisation n\'existe pas');
        }

        // Vérifier que l'utilisateur existe et appartient à l'organisation
        const users = await db
            .select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);

        if (users.length === 0) {
            throw new Error('L\'utilisateur n\'existe pas');
        }

        const foundUser = users[0];

        // Vérifier que l'utilisateur appartient à l'organisation (ou est un ADMIN)
        if (foundUser.role === 'USER' && foundUser.organizationId !== organizationId) {
            throw new Error('L\'utilisateur n\'appartient pas à cette organisation');
        }

        // Calculer expiresAt = paidAt + 12 mois
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        // Créer l'abonnement
        const newSub = await db
            .insert(subscription)
            .values({
                organizationId,
                userId,
                amount,
                currency,
                paidAt: now,
                expiresAt,
            })
            .returning();

        return this.getSubscriptionWithJoins(newSub[0].id);
    }

    private static async getSubscriptionWithJoins(subscriptionId: string): Promise<SubscriptionResponse> {
        const subs = await db
            .select()
            .from(subscription)
            .innerJoin(organization, eq(subscription.organizationId, organization.id))
            .innerJoin(user, eq(subscription.userId, user.id))
            .where(eq(subscription.id, subscriptionId))
            .limit(1);

        if (subs.length === 0) {
            throw new Error('L\'abonnement n\'existe pas');
        }

        return this.mapToResponse(subs[0]);
    }

    // Mettre à jour mapToResponse
    private static mapToResponse(data: any): SubscriptionResponse {
        // Gérer les deux cas : jointure ou row simple
        const sub = data.subscription || data;
        const org = data.organization;
        const usr = data.user;

        const now = new Date();
        const isActive = sub.expiresAt > now;

        return {
            id: sub.id,
            organization: {id: org.id, name: org.name},
            user: {id: usr.id, fullName: `${usr.firstName} ${usr.lastName}` },
            amount: sub.amount,
            currency: sub.currency,
            paidAt: sub.paidAt,
            expiresAt: sub.expiresAt,
            isActive,
            createdAt: sub.createdAt,
        };
    }

    // Récupérer l'abonnement actif d'une organisation
    static async getActiveSubscription(organizationId: string): Promise<SubscriptionResponse | null> {
        const now = new Date();

        // Chercher le dernier abonnement qui n'a pas expiré avec jointures
        const subs = await db
            .select()
            .from(subscription)
            .innerJoin(organization, eq(subscription.organizationId, organization.id))
            .innerJoin(user, eq(subscription.userId, user.id))
            .where(
                and(
                    eq(subscription.organizationId, organizationId),
                    gt(subscription.expiresAt, now)
                )
            )
            .orderBy(subscription.expiresAt)
            .limit(1);

        if (subs.length === 0) {
            return null;
        }

        return this.mapToResponse(subs[0]);
    }

    // Récupérer tous les abonnements avec filtres (admin only)
    static async listSubscriptions(
        page: number,
        limit: number,
        organizationId?: string,
        isActive?: boolean
    ): Promise<{ data: SubscriptionResponse[]; total: number }> {
        const now = new Date();
        const conditions: any[] = [];

        if (organizationId) {
            conditions.push(eq(subscription.organizationId, organizationId));
        }

        if (isActive === true) {
            conditions.push(gt(subscription.expiresAt, now));
        } else if (isActive === false) {
            conditions.push(lt(subscription.expiresAt, now));
        }

        const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

        // Récupérer le total
        const totalResult = await db
            .select({ count: count() })
            .from(subscription)
            .where(whereCondition);

        const total = totalResult[0]?.count || 0;

        // Récupérer avec jointures
        const offset = (page - 1) * limit;
        const subs = await db
            .select()
            .from(subscription)
            .innerJoin(organization, eq(subscription.organizationId, organization.id))
            .innerJoin(user, eq(subscription.userId, user.id))
            .where(whereCondition)
            .orderBy(subscription.createdAt)
            .limit(limit)
            .offset(offset);

        return {
            data: subs.map((sub) => this.mapToResponse(sub)),
            total,
        };
    }
}