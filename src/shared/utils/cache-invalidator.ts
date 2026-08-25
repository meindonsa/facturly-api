import { cache } from './cache.js';

/**
 * Invalider le cache intelligemment selon le type d'action
 */
export function invalidateCache(action: string, entityType?: string): void {
    switch (action) {
        // Invoices
        case 'CREATE_INVOICE':
            cache.invalidate('GET:/invoices'); // Invalider les listes
            break;
        case 'UPDATE_INVOICE':
            cache.invalidate('GET:/invoices'); // Invalider les listes
            break;
        case 'DELETE_INVOICE':
            cache.invalidate('GET:/invoices');
            break;
        case 'MARK_INVOICE_PAID':
            cache.invalidate('GET:/invoices');
            break;
        case 'CANCEL_INVOICE':
            cache.invalidate('GET:/invoices');
            break;

        // Organizations
        case 'CREATE_ORGANIZATION':
            cache.invalidate('GET:/organizations');
            break;
        case 'UPDATE_ORGANIZATION':
            cache.invalidate('GET:/organizations');
            break;
        case 'UPDATE_ORG_STATUS':
            cache.invalidate('GET:/organizations');
            cache.invalidate('GET:/subscriptions'); // Affecte aussi les subscriptions
            break;
        case 'UPDATE_ORG_LOGO':
            cache.invalidate('GET:/organizations');
            break;

        // Users
        case 'CREATE_ADMIN':
            cache.invalidate('GET:/users');
            break;
        case 'DEACTIVATE_USER':
            cache.invalidate('GET:/users');
            break;
        case 'DELETE_USER':
            cache.invalidate('GET:/users');
            break;

        // Subscriptions
        case 'CREATE_SUBSCRIPTION':
            cache.invalidate('GET:/subscriptions');
            break;

        default:
            break;
    }
}