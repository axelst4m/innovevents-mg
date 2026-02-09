# CI/CD - Intégration et Déploiement Continu

Documentation de la pipeline CI/CD mise en place avec GitHub Actions.

## Vue d'ensemble

Le projet utilise deux workflows GitHub Actions :

1. **CI (ci.yml)** : Tests automatiques à chaque push/PR
2. **CD (deploy.yml)** : Déploiement automatique sur la branche main

## Workflow CI - Tests

**Fichier** : `.github/workflows/ci.yml`

**Déclenchement** :
- Push sur `dev` ou `main`
- Pull Request vers `dev` ou `main`

### Jobs

#### 1. test-api

Exécute les tests de l'API avec une base de données de test.

**Services Docker utilisés** :
- PostgreSQL 16 (port 5432)
- MongoDB 7 (port 27017)

**Étapes** :
1. Checkout du code
2. Setup Node.js 20
3. Installation des dépendances (`npm ci`)
4. Linting (`npm run lint`)
5. Tests avec couverture (`npm test -- --coverage`)
6. Upload du rapport de couverture

**Variables d'environnement** :
```
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/innovevents_test
MONGO_URL=mongodb://localhost:27017/innovevents_test
JWT_SECRET=test-secret-key-for-ci
```

#### 2. build-web

Vérifie que le frontend compile correctement.

**Étapes** :
1. Checkout du code
2. Setup Node.js 20
3. Installation des dépendances
4. Linting
5. Build de production
6. Upload de l'artifact de build

#### 3. check-mobile

Vérifie la configuration de l'app mobile Expo.

**Étapes** :
1. Checkout du code
2. Setup Node.js 20
3. Installation des dépendances
4. Vérification avec `expo doctor`

## Workflow CD - Déploiement

**Fichier** : `.github/workflows/deploy.yml`

**Déclenchement** :
- Push sur `main` uniquement

**Concurrence** : Un seul déploiement à la fois (groupe `production`)

### Jobs

#### 1. test

Réutilise le workflow CI pour s'assurer que les tests passent.

#### 2. deploy-api

Déploie l'API sur l'hébergeur configuré.

**Options de déploiement** :
- Fly.io (configuré par défaut)
- Docker Registry + Railway/Render
- Autre plateforme PaaS

**Secrets requis** :
- `FLY_API_TOKEN` : Token d'authentification Fly.io

#### 3. deploy-web

Déploie le frontend sur l'hébergeur configuré.

**Options de déploiement** :
- Vercel (configuré par défaut)
- Netlify
- Fly.io (static)

**Secrets requis** :
- `VERCEL_TOKEN` : Token Vercel
- `VERCEL_ORG_ID` : ID de l'organisation Vercel
- `VERCEL_PROJECT_ID` : ID du projet Vercel
- `API_URL` : URL de l'API en production

#### 4. notify

Envoie une notification du résultat du déploiement (optionnel Slack).

## Configuration des secrets GitHub

Pour configurer les secrets dans GitHub :

1. Aller dans Settings > Secrets and variables > Actions
2. Ajouter les secrets suivants :

| Secret | Description |
|--------|-------------|
| `FLY_API_TOKEN` | Token API Fly.io |
| `VERCEL_TOKEN` | Token Vercel |
| `VERCEL_ORG_ID` | ID organisation Vercel |
| `VERCEL_PROJECT_ID` | ID projet Vercel |
| `API_URL` | URL de l'API en prod |
| `SLACK_WEBHOOK` | (optionnel) Webhook Slack |

## Flux de travail Git

```
feature/* ──┬──> dev ──────> main
            │     │            │
            │     ▼            ▼
            │   CI Tests    CI Tests
            │                  │
            │                  ▼
            │              Déploiement
            │              automatique
            │
            └── PR Review
```

### Branches

- **main** : Production, protégée, déploiement auto
- **dev** : Développement, tests CI
- **feature/*** : Fonctionnalités en cours

### Processus de développement

1. Créer une branche depuis `dev` : `git checkout -b feature/ma-fonctionnalite`
2. Développer et commiter
3. Pousser et créer une PR vers `dev`
4. Les tests CI s'exécutent automatiquement
5. Après review et merge dans `dev`, tester en local
6. Créer une PR de `dev` vers `main`
7. Après merge, le déploiement s'effectue automatiquement

## Commandes locales utiles

```bash
# Lancer les tests localement
cd apps/api && npm test

# Lancer les tests avec couverture
cd apps/api && npm test -- --coverage

# Build du frontend
cd apps/web && npm run build

# Vérifier l'app mobile
cd apps/mobile && npx expo doctor
```

## Rapport de couverture

Le rapport de couverture est généré à chaque exécution du CI et disponible :
- Dans les artifacts du workflow (7 jours)
- En local dans `apps/api/coverage/`

Pour visualiser le rapport HTML :
```bash
cd apps/api
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Déploiement manuel

En cas de besoin, le déploiement peut être effectué manuellement :

### API sur Fly.io

```bash
cd apps/api
flyctl auth login
flyctl deploy
```

### Frontend sur Vercel

```bash
cd apps/web
npm run build
npx vercel --prod
```

## Troubleshooting

### Les tests échouent en CI mais passent en local

- Vérifier les variables d'environnement
- S'assurer que les services (Postgres, Mongo) sont bien démarrés
- Vérifier les timeouts des services

### Le déploiement échoue

- Vérifier les secrets GitHub
- Consulter les logs du workflow
- Vérifier les quotas de l'hébergeur

### Le build frontend échoue

- Vérifier que `VITE_API_URL` est défini
- S'assurer que toutes les dépendances sont dans package.json
