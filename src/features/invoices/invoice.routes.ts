import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authGuard } from '../../shared/middlewares/auth-guard.js';
import { InvoiceService } from './invoice.service.js';
import { createInvoiceSchema } from './invoice.schema.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

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

export default invoiceRoutes;