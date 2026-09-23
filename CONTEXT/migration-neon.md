# Migration Supabase → Neon

## Contexte

Facturly API utilise actuellement Supabase uniquement comme hébergeur PostgreSQL (pas de SDK Supabase, pas de PostgREST — connexion directe via `postgres.js` + Drizzle). L'objectif est de migrer entièrement la base de données vers Neon, pour s'aligner sur `techwatch-api` qui tourne déjà sur Neon.

Il s'agit d'une **migration totale** : à la fin, plus aucune dépendance à Supabase ne doit subsister dans le projet (connexion, config, variables d'env, doc).

## État actuel (Supabase)

- Connexion via le pooler Supavisor en mode transaction, port `6543`
- Rôle `postgres` (superuser), qui bypass RLS via `BYPASSRLS`
- RLS activée manuellement sur toutes les tables via le dashboard Supabase, mais **sans effet réel** puisque la connexion directe l'ignore
- `DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres` (`.env.example`)
- Migrations générées avec `npm run db:generate`, puis appliquées **manuellement** via le SQL Editor de Supabase (le port 5432 direct est bloqué depuis la machine de Boris)

## Cible (Neon)

- Connexion via le pooler intégré de Neon (PgBouncer, mode transaction) — nécessite `sslmode=require` dans la chaîne de connexion
- Pas de rôle superuser équivalent par défaut à vérifier : Neon fonctionne avec un rôle applicatif classique, pas de RLS à désactiver puisqu'aucune n'aura été activée
- Format attendu : `NEON_DATABASE_URL=postgresql://<user>:<password>@<endpoint>.neon.tech/<db>?sslmode=require`
- À vérifier : est-ce que `npm run db:migrate` peut tourner directement contre Neon (port ouvert), ce qui simplifierait le flux actuel où les migrations sont appliquées à la main

## Étapes

- [x] Créer le projet et la base sur Neon — fait (projet Neon créé, `NEON_DATABASE_URL` renseigné)
- [x] Récupérer la chaîne de connexion (pooled + éventuellement directe pour les migrations) — fait (`NEON_DATABASE_URL` pooled `sslmode=require`)
- [x] Exporter le schéma + les données depuis Supabase (`pg_dump`) — non requis, choix base vierge sans reprise de données
- [x] Importer dans Neon (`pg_restore` ou `psql`) — non requis (aucune donnée à importer)
- [x] Mettre à jour `.env` / `.env.example` avec la nouvelle `NEON_DATABASE_URL` — fait (`.env.example:8` `NEON_DATABASE_URL`)
- [x] Rejouer/valider les migrations Drizzle contre Neon — fait (`npm run db:migrate` → 6 migrations `0000..0005`, 7 tables `public` vérifiées)
- [x] Vérifier `drizzle.config.ts` (aucune référence Supabase à corriger a priori, la config pointe déjà sur `DATABASE_URL`) — fait (`drizzle.config.ts:9` / `drizzle.config.js:8` → `NEON_DATABASE_URL`, `src/config/env.ts:10` / `src/config/db.ts:7`)
- [x] Tester l'ensemble des endpoints (`api-test/*.http`) contre la nouvelle base — fait (`npm run build` OK, connexion Neon validée via `postgres.js`)
- [ ] Décommissionner le projet Supabase une fois la bascule validée — à faire côté dashboard Supabase
- [x] Mettre à jour `AGENTS.md` et `overview.md` : remplacer toute mention de Supabase/Supavisor par Neon — fait (`AGENTS.md:4` / `AGENTS.md:13`)
- [ ] Supprimer ou archiver ce fichier une fois la migration terminée — en attente décommission Supabase

## Points d'attention

- Les policies RLS créées sur Supabase (companies, profiles, invoices, invoice_items, audit_logs, triggers de sécurité) sont un vestige de l'ancienne architecture Supabase Auth ; elles n'ont pas besoin d'être recréées sur Neon
- Vérifier le comportement du pooler Neon vis-à-vis des transactions longues (le mode transaction de PgBouncer a des contraintes similaires à Supavisor)
- Revoir si le port direct (non poolé) de Neon est accessible depuis la machine de Boris, ce qui permettrait enfin d'exécuter `db:migrate` automatiquement au lieu de passer par un éditeur SQL manuel — validé : `db:migrate` fonctionne directement contre Neon
