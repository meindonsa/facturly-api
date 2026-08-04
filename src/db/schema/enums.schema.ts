import { pgEnum } from 'drizzle-orm/pg-core';

// ADMIN n'appartient à aucune organisation, USER appartient toujours à une organisation
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER']);

// Tant qu'une organisation n'est pas ACTIVE, ses users ne peuvent rien faire
export const organizationStatusEnum = pgEnum('organization_status', [
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'INACTIVE',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
    'DRAFT',
    'SENT',
    'PAID',
    'OVERDUE',
    'CANCELLED',
]);

// Niveau de sévérité pour la table de logs
export const logLevelEnum = pgEnum('log_level', ['INFO', 'WARNING', 'ERROR', 'CRITICAL']);