import { eq, and, ilike, or, count } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { user, organization } from '../../db/schema/index.js';
import { hashPassword } from '../../shared/utils/password.js';
import type { CreateAdminRequest, UserResponse } from './user.schema.js';

export class UserService {
    // Créer un nouvel admin
    static async createAdmin(req: CreateAdminRequest): Promise<UserResponse> {
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

        return this.mapToResponse(newUser[0], null);
    }

    // Récupérer les utilisateurs avec filtres et pagination
    static async listUsers(
        page: number,
        limit: number,
        userRole: 'ADMIN' | 'USER',
        userOrgId: string | undefined,
        search?: string,
        roleFilter?: string,
        organizationIdFilter?: string,
        isActive?: boolean
    ): Promise<{ data: UserResponse[]; total: number }> {
        const conditions: any[] = [];

        if (userRole === 'USER') {
            conditions.push(eq(user.organizationId, userOrgId!));
        }
        // Pour les ADMINs, si un filtre d'organisation est fourni, l'appliquer
        else if (organizationIdFilter) {
            conditions.push(eq(user.organizationId, organizationIdFilter));
        }

        // Filtrer par rôle
        if (roleFilter) {
            conditions.push(eq(user.role, roleFilter as any));
        }

        // Filtrer par statut actif/inactif
        if (isActive !== undefined) {
            conditions.push(eq(user.isActive, isActive));
        }

        // Recherche
        if (search) {
            conditions.push(
                or(
                    ilike(user.email, `%${search}%`),
                    ilike(user.firstName, `%${search}%`),
                    ilike(user.lastName, `%${search}%`)
                )
            );
        }

        const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

        // Récupérer le total
        const totalResult = await db
            .select({ count: count() })
            .from(user)
            .where(whereCondition);

        const total = totalResult[0]?.count || 0;

        // Récupérer les utilisateurs avec jointure organisation
        const offset = (page - 1) * limit;
        const users = await db
            .select()
            .from(user)
            .leftJoin(organization, eq(user.organizationId, organization.id))
            .where(whereCondition)
            .orderBy(user.createdAt)
            .limit(limit)
            .offset(offset);

        return {
            data: users.map((u) => this.mapToResponse(u.user, u.organization)),
            total,
        };
    }

    // Désactiver un utilisateur
    static async deactivateUser(userId: string): Promise<UserResponse> {
        const users = await db
            .select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);

        if (users.length === 0) {
            throw new Error('L\'utilisateur n\'existe pas');
        }

        const updated = await db
            .update(user)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(user.id, userId))
            .returning();

        // Récupérer l'organisation si c'est un USER
        if (updated[0].organizationId) {
            const orgs = await db
                .select()
                .from(organization)
                .where(eq(organization.id, updated[0].organizationId))
                .limit(1);
            return this.mapToResponse(updated[0], orgs[0] || null);
        }

        return this.mapToResponse(updated[0], null);
    }

    // Supprimer complètement un utilisateur
    static async deleteUser(userId: string): Promise<void> {
        const users = await db
            .select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);

        if (users.length === 0) {
            throw new Error('L\'utilisateur n\'existe pas');
        }

        await db.delete(user).where(eq(user.id, userId));
    }

    // Mapper une row vers une réponse typée
    private static mapToResponse(usr: any, org: any): UserResponse {
        return {
            id: usr.id,
            email: usr.email,
            firstName: usr.firstName,
            lastName: usr.lastName,
            fullName: `${usr.firstName} ${usr.lastName}`,
            role: usr.role,
            organization: org ? { id: org.id, name: org.name } : null,
            isActive: usr.isActive,
            createdAt: usr.createdAt,
            updatedAt: usr.updatedAt,
        };
    }
}