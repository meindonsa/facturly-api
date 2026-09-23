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
- Format attendu : `DATABASE_URL=postgresql://<user>:<password>@<endpoint>.neon.tech/<db>?sslmode=require`
- À vérifier : est-ce que `npm run db:migrate` peut tourner directement contre Neon (port ouvert), ce qui simplifierait le flux actuel où les migrations sont appliquées à la main

## Étapes

- [ ] Créer le projet et la base sur Neon
- [ ] Récupérer la chaîne de connexion (pooled + éventuellement directe pour les migrations)
- [ ] Exporter le schéma + les données depuis Supabase (`pg_dump`)
- [ ] Importer dans Neon (`pg_restore` ou `psql`)
- [ ] Mettre à jour `.env` / `.env.example` avec la nouvelle `DATABASE_URL`
- [ ] Rejouer/valider les migrations Drizzle contre Neon
- [ ] Vérifier `drizzle.config.ts` (aucune référence Supabase à corriger a priori, la config pointe déjà sur `DATABASE_URL`)
- [ ] Tester l'ensemble des endpoints (`api-test/*.http`) contre la nouvelle base
- [ ] Décommissionner le projet Supabase une fois la bascule validée
- [ ] Mettre à jour `AGENTS.md` et `overview.md` : remplacer toute mention de Supabase/Supavisor par Neon
- [ ] Supprimer ou archiver ce fichier une fois la migration terminée

## Points d'attention

- Les policies RLS créées sur Supabase (companies, profiles, invoices, invoice_items, audit_logs, triggers de sécurité) sont un vestige de l'ancienne architecture Supabase Auth ; elles n'ont pas besoin d'être recréées sur Neon
- Vérifier le comportement du pooler Neon vis-à-vis des transactions longues (le mode transaction de PgBouncer a des contraintes similaires à Supavisor)
- Revoir si le port direct (non poolé) de Neon est accessible depuis la machine de Boris, ce qui permettrait enfin d'exécuter `db:migrate` automatiquement au lieu de passer par un éditeur SQL manuel