import { eq } from 'drizzle-orm';
import { db } from '../../config/db.js';
import { invoice, invoiceItem, organization } from '../../db/schema/index.js';
import type { CreateInvoiceRequest, InvoiceResponse } from './invoice.schema.js';

export class InvoiceService {
    // Générer le numéro de facture au format FAC-YYYYMMDD-XXXX
    private static generateInvoiceNumber(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        return `FAC-${year}${month}${day}-${random}`;
    }

    // Créer une nouvelle facture avec ses items
    static async createInvoice(req: CreateInvoiceRequest): Promise<InvoiceResponse> {
        const { organizationId, clientName, clientEmail, clientAddress, items } = req;

        // Vérifier que l'organisation existe
        const orgs = await db
            .select()
            .from(organization)
            .where(eq(organization.id, organizationId))
            .limit(1);

        if (orgs.length === 0) {
            throw new Error('L\'organisation n\'existe pas');
        }

        // Vérifier que l'organisation est active
        if (orgs[0].status !== 'ACTIVE') {
            throw new Error('L\'organisation n\'est pas active');
        }

        // Calculer le montant total
        const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        // Générer le numéro de facture
        const invoiceNumber = this.generateInvoiceNumber();

        // Créer la facture
        const newInvoice = await db
            .insert(invoice)
            .values({
                organizationId,
                number: invoiceNumber,
                status: 'DRAFT',
                clientName,
                clientEmail: clientEmail || null,
                clientAddress: clientAddress || null,
                totalAmount,
                issueDate: new Date(),
            })
            .returning();

        const createdInvoice = newInvoice[0];

        // Créer les items
        const itemsToInsert = items.map((item) => ({
            invoiceId: createdInvoice.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
        }));

        const createdItems = await db
            .insert(invoiceItem)
            .values(itemsToInsert)
            .returning();

        return this.mapToResponse(createdInvoice, createdItems);
    }

    // Mapper une facture et ses items vers une réponse typée
    private static mapToResponse(inv: any, items: any[]): InvoiceResponse {
        return {
            id: inv.id,
            organizationId: inv.organizationId,
            number: inv.number,
            status: inv.status,
            clientName: inv.clientName,
            clientEmail: inv.clientEmail,
            clientAddress: inv.clientAddress,
            totalAmount: inv.totalAmount,
            issueDate: inv.issueDate,
            paidAt: inv.paidAt,
            items: items.map((item) => ({
                id: item.id,
                invoiceId: item.invoiceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                createdAt: item.createdAt,
            })),
            createdAt: inv.createdAt,
            updatedAt: inv.updatedAt,
        };
    }
}