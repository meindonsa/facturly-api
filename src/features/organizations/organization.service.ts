import { eq, like, ilike, count } from 'drizzle-orm';
import { db, } from '../../config/db.js';
import { organization } from '../../db/schema/index.js';
import type {
    CreateOrganizationRequest,
    UpdateOrganizationInfoRequest,
    UpdateOrganizationStatusRequest,
    OrganizationResponse,
} from './organization.schema.js';

export class OrganizationService {

    static async createOrganization(req: CreateOrganizationRequest): Promise<OrganizationResponse> {
        const newOrg = await db
            .insert(organization)
            .values({
                name: req.name,
                email: req.email || null,
                phone: req.phone || null,
                address: req.address || null,
                status: 'PENDING',
            })
            .returning();

        return this.mapToResponse(newOrg[0]);
    }

    // Récupérer une organisation par ID
    static async getOrganization(orgId: string): Promise<OrganizationResponse | null> {
        const orgs = await db
            .select()
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1);

        if (orgs.length === 0) {
            return null;
        }

        return this.mapToResponse(orgs[0]);
    }

    // Mettre à jour les infos de l'organisation
    static async updateOrganizationInfo(
        orgId: string,
        req: UpdateOrganizationInfoRequest
    ): Promise<OrganizationResponse> {
        const updates: Record<string, any> = {};

        if (req.name !== undefined) updates.name = req.name;
        if (req.email !== undefined) updates.email = req.email || null;
        if (req.phone !== undefined) updates.phone = req.phone || null;
        if (req.address !== undefined) updates.address = req.address || null;
        updates.updatedAt = new Date();

        const updated = await db
            .update(organization)
            .set(updates)
            .where(eq(organization.id, orgId))
            .returning();

        if (updated.length === 0) {
            throw new Error('L\'organisation n\'existe pas');
        }

        return this.mapToResponse(updated[0]);
    }

    // Changer le statut (admin only)
    static async updateOrganizationStatus(
        orgId: string,
        req: UpdateOrganizationStatusRequest
    ): Promise<OrganizationResponse> {
        const updated = await db
            .update(organization)
            .set({ status: req.status as any, updatedAt: new Date() })
            .where(eq(organization.id, orgId))
            .returning();

        if (updated.length === 0) {
            throw new Error('L\'organisation n\'existe pas');
        }

        return this.mapToResponse(updated[0]);
    }

    // Mettre à jour le logo (stocké en URL, le fichier est uploadé ailleurs)
    static async updateOrganizationLogo(orgId: string, logoUrl: string): Promise<OrganizationResponse> {
        const updated = await db
            .update(organization)
            .set({ logoUrl, updatedAt: new Date() })
            .where(eq(organization.id, orgId))
            .returning();

        if (updated.length === 0) {
            throw new Error('L\'organisation n\'existe pas');
        }

        return this.mapToResponse(updated[0]);
    }

    private static mapToResponse(org: any): OrganizationResponse {
        return {
            id: org.id,
            name: org.name,
            status: org.status,
            email: org.email,
            phone: org.phone,
            address: org.address,
            logoUrl: org.logoUrl || null,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
        };
    }

    static async listOrganizations(
        page: number,
        limit: number,
        search?: string
    ): Promise<{ data: OrganizationResponse[]; total: number }> {
        let query = db.select().from(organization);

        // Recherche par nom ou email
        if (search) {
            query = query.where(
                db.or(
                    ilike(organization.name, `%${search}%`),
                    ilike(organization.email, `%${search}%`)
                )
            );
        }

        // Récupérer le total pour la pagination
        const totalResult = await db
            .select({ count: count() })
            .from(organization)
            .where(search ?
                db.or(
                    ilike(organization.name, `%${search}%`),
                    ilike(organization.email, `%${search}%`)
                )
                : undefined
            );

        const total = totalResult[0]?.count || 0;

        const offset = (page - 1) * limit;
        const orgs = await query.limit(limit).offset(offset);

        return {
            data: orgs.map((org) => this.mapToResponse(org)),
            total,
        };
    }
}