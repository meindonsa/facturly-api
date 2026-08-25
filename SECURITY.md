# SECURITY
Détaille tout ce qui a été fait côté sécurité :

- Authentification JWT (access + refresh tokens)
- Autorisation (rôles ADMIN/USER)
- Hachage des mots de passe (Argon2id)
- CORS (origines autorisées)
- Rate limiting par endpoint
- Validation Zod des inputs
- Gestion d'erreurs globale
- Logging & audit automatique
- Caching intelligent
- Ordre d'exécution des middlewares
- Contraintes de DB
- Checklist de déploiement production
- Améliorations futures