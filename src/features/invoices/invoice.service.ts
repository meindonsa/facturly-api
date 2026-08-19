import {eq, inArray} from 'drizzle-orm';
import { db } from '../../config/db.js';
import { invoice, invoiceItem, organization } from '../../db/schema/index.js';
import type {CreateInvoiceRequest, InvoiceResponse, UpdateInvoiceRequest} from './invoice.schema.js';

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
        const { organizationId, clientName, clientEmail, clientPhone, deliveryAmount, clientAddress, items } = req;

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
        const totalProduct = items.reduce((sum, item) => sum + item.quantity, 0); // Nombre total d'items
        const totalProductAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0); // Montant total des produits
        const totalAmount = totalProductAmount + deliveryAmount;

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
                clientPhone: clientPhone || null,
                clientEmail: clientEmail || null,
                clientAddress: clientAddress || null,
                totalProduct,
                totalProductAmount,
                deliveryAmount,
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

    // Mettre à jour une facture (tous les champs)
    static async updateInvoice(
        invoiceId: string,
        req: UpdateInvoiceRequest
    ): Promise<InvoiceResponse> {
        const {
            clientName,
            clientEmail,
            clientPhone,
            clientAddress,
            deliveryAmount,
            items,
            deleteItemIds = []
        } = req;

        // Récupérer la facture
        const invoices = await db
            .select()
            .from(invoice)
            .where(eq(invoice.id, invoiceId))
            .limit(1);

        if (invoices.length === 0) {
            throw new Error('La facture n\'existe pas');
        }

        const inv = invoices[0];

        // Vérifier que c'est en DRAFT
        if (inv.status !== 'DRAFT') {
            throw new Error('Seules les factures en DRAFT peuvent être modifiées');
        }

        // Supprimer les items demandés
        if (deleteItemIds.length > 0) {
            await db
                .delete(invoiceItem)
                .where(inArray(invoiceItem.id, deleteItemIds));
        }

        // Traiter les items (ajouter/mettre à jour)
        for (const item of items) {
            if (item.id) {
                // Mettre à jour un item existant
                await db
                    .update(invoiceItem)
                    .set({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                    })
                    .where(eq(invoiceItem.id, item.id));
            } else {
                // Créer un nouvel item
                await db.insert(invoiceItem).values({
                    invoiceId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                });
            }
        }

        // Récupérer tous les items mis à jour
        const updatedItems = await db
            .select()
            .from(invoiceItem)
            .where(eq(invoiceItem.invoiceId, invoiceId));

        // Recalculer les montants
        const totalProduct = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalProductAmount = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const newDeliveryAmount = deliveryAmount !== undefined ? deliveryAmount : inv.deliveryAmount;
        const totalAmount = totalProductAmount + newDeliveryAmount;

        // Mettre à jour les infos de la facture
        const updates: Record<string, any> = {
            totalProduct,
            totalProductAmount,
            deliveryAmount: newDeliveryAmount,
            totalAmount,
            updatedAt: new Date(),
        };

        // Ajouter les champs optionnels s'ils sont fournis
        if (clientName !== undefined) updates.clientName = clientName;
        if (clientPhone !== undefined) updates.clientPhone = clientPhone || null;
        if (clientEmail !== undefined) updates.clientEmail = clientEmail || null;
        if (clientAddress !== undefined) updates.clientAddress = clientAddress || null;

        const updated = await db
            .update(invoice)
            .set(updates)
            .where(eq(invoice.id, invoiceId))
            .returning();

        return this.mapToResponse(updated[0], updatedItems);
    }

    // Mapper une facture et ses items vers une réponse typée
    private static mapToResponse(inv: any, items: any[]): InvoiceResponse {
        return {
            id: inv.id,
            organizationId: inv.organizationId,
            number: inv.number,
            status: inv.status,
            clientName: inv.clientName,
            clientPhone: inv.clientPhone,
            clientEmail: inv.clientEmail,
            clientAddress: inv.clientAddress,
            totalProduct: inv.totalProduct, // ✅ Ajouter
            totalProductAmount: inv.totalProductAmount, // ✅ Ajouter
            deliveryAmount: inv.deliveryAmount, // ✅ Ajouter
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