import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authGuard } from '../../shared/middlewares/auth-guard.js';
import { InvoiceService } from './invoice.service.js';
import {createInvoiceSchema, updateInvoiceSchema} from './invoice.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import {db} from "../../config/db.js";
import {invoice} from "../../db/schema/index.js";
import {eq} from "drizzle-orm";

const invoiceRoutes = new Hono<{ Variables: { auth: any } }>();

// POST /invoices - Créer une nouvelle facture
invoiceRoutes.post(
    '/',
    authGuard,
    zValidator('json', createInvoiceSchema),
    async (c) => {
        try {
            const auth = c.get('auth');
            const payload = c.req.valid('json');

            // Vérifier que l'user appartient à l'organisation (sauf si admin)
            if (auth.role !== 'USER' || auth.organizationId !== payload.organizationId) {
                return sendError(c, 'FORBIDDEN', 'Vous n\'avez pas accès à cette organisation', 403);
            }

            const inv = await InvoiceService.createInvoice(payload);
            return sendSuccess(c, inv, 201);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la création';
            return sendError(c, 'CREATE_INVOICE_FAILED', message, 400);
        }
    }
);

// PATCH /invoices/:id - Mettre à jour une facture
invoiceRoutes.patch(
    '/:id',
    authGuard,
    zValidator('json', updateInvoiceSchema),
    async (c) => {
        try {
            const auth = c.get('auth');
            const invoiceId = c.req.param('id');
            const payload = c.req.valid('json');

            // Récupérer la facture pour vérifier l'accès
            const inv = await db
                .select()
                .from(invoice)
                .where(eq(invoice.id, invoiceId))
                .limit(1);

            if (inv.length === 0) {
                return sendError(c, 'NOT_FOUND', 'La facture n\'existe pas', 404);
            }

            // Vérifier que l'user appartient à l'organisation (sauf si admin)
            if (auth.role !== 'USER' || auth.organizationId !== inv[0].organizationId) {
                return sendError(c, 'FORBIDDEN', 'Vous n\'avez pas accès à cette facture', 403);
            }

            const updated = await InvoiceService.updateInvoice(invoiceId, payload);
            return sendSuccess(c, updated, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
            return sendError(c, 'UPDATE_INVOICE_FAILED', message, 400);
        }
    }
);

// PATCH /invoices/paid/:id - Marquer comme payée
invoiceRoutes.patch(
    '/paid/:id',
    authGuard,
    async (c) => {
        try {
            const auth = c.get('auth');
            const invoiceId = c.req.param('id');

            if (!invoiceId) {
                return sendError(c, 'INVALID_ID', 'ID de facture invalide', 400);
            }
            // Récupérer la facture pour vérifier l'accès
            const invoices = await db
                .select()
                .from(invoice)
                .where(eq(invoice.id, invoiceId))
                .limit(1);

            if (invoices.length === 0) {
                return sendError(c, 'NOT_FOUND', 'La facture n\'existe pas', 404);
            }

            // Vérifier que l'user appartient à l'organisation (sauf si admin)
            if (auth.role !== 'USER' || auth.organizationId !== invoices[0].organizationId) {
                return sendError(c, 'FORBIDDEN', 'Vous n\'avez pas accès à cette facture', 403);
            }

            const updated = await InvoiceService.markAsPaid(invoiceId);
            return sendSuccess(c, updated, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors du paiement';
            return sendError(c, 'MARK_PAID_FAILED', message, 400);
        }
    }
);

// PATCH /invoices/cancel/:id - Annuler une facture
invoiceRoutes.patch(
    '/cancel/:id',
    authGuard,
    async (c) => {
        try {
            const auth = c.get('auth');
            const invoiceId = c.req.param('id');

            if (!invoiceId) {
                return sendError(c, 'INVALID_ID', 'ID de facture invalide', 400);
            }

            const invoices = await db
                .select()
                .from(invoice)
                .where(eq(invoice.id, invoiceId))
                .limit(1);

            if (invoices.length === 0) {
                return sendError(c, 'NOT_FOUND', 'La facture n\'existe pas', 404);
            }

            if (auth.role !== 'USER' || auth.organizationId !== invoices[0].organizationId) {
                return sendError(c, 'FORBIDDEN', 'Vous n\'avez pas accès à cette facture', 403);
            }

            const updated = await InvoiceService.cancel(invoiceId);
            return sendSuccess(c, updated, 200);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur lors de l\'annulation';
            return sendError(c, 'CANCEL_FAILED', message, 400);
        }
    }
);

export default invoiceRoutes;