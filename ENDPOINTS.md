# ENDPOINTS.md

Documentation complète de tous les endpoints :

URL: `http://localhost:3000`

- Santé (/health) => `/health`
- Auth : `/auth`
  - register: `/register` => POST
  - register admin: `/register/admin` => POST
  - login: `/login` => POST
  - logout: `/logout` => POST
  - refresh => `/refresh` => POST
- Organizations (CRUD + logo + statut)
- Users (admin, list, deactivate, delete)
- Invoices (CRUD + paiement + annulation)
- Subscriptions (create, active, list)
- Logs (list avec filtres)
- Cache (stats, invalidate)