import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import {env} from "./config/env.js";
import {closeDb} from "./config/db.js";
import authRoutes from "./features/auth/auth.routes.js";
import organizationRoutes from "./features/organizations/organization.routes.js";
import invoiceRoutes from "./features/invoices/invoice.routes.js";
import subscriptionRoutes from "./features/subscriptions/subscription.routes.js";

const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (c) => {
  return c.text('Facturly Backend API');
});

app.route('/auth', authRoutes);
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