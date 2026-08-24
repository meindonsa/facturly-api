import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import {env} from "./config/env.js";
import {closeDb} from "./config/db.js";
import authRoutes from "./features/auth/auth.routes.js";
import organizationRoutes from "./features/organizations/organization.routes.js";
import invoiceRoutes from "./features/invoices/invoice.routes.js";
import subscriptionRoutes from "./features/subscriptions/subscription.routes.js";
import userRoutes from "./features/users/user.routes.js";
import logRoutes from "./features/logs/log.routes.js";
import {loggingMiddleware} from "./shared/middlewares/logging-middleware.js";
import {errorHandler} from "./shared/middlewares/error-handler.js";

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (c) => {
  return c.text('Facturly Backend API');
});

// Middlewares globaux
app.use('*', errorHandler);
app.use('*', loggingMiddleware); // ✅ Ajouter ici

app.route('/logs', logRoutes);
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/invoices', invoiceRoutes);
app.route('/subscriptions', subscriptionRoutes);
app.route('/organizations', organizationRoutes);

serve({
  fetch: app.fetch,
  port: env.PORT
}, (info) => {
  console.log(`✅ Serveur démarré sur http://localhost:${info.port}`);
  console.log(`📊 Environnement : ${env.NODE_ENV}`);
  console.log(`🗄️ Base de données connectée`);
})

process.on('SIGTERM', async () => {
  console.log('⏹️ SIGTERM reçu, fermeture propre...');
  await closeDb();
  process.exit(0);
});