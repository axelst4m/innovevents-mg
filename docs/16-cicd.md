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

Voici un exemple de pipeline CD qui s'execute avec succes apres un push sur main :

![Pipeline CD reussie](images/CICD_success.png)

### Jobs

#### 1. test

Réutilise le workflow CI pour s'assurer que les tests passent avant tout déploiement.

#### 2. deploy

Déploie l'application complète (API + frontend) sur le VPS via SSH.

**Méthode** : connexion SSH au VPS avec `appleboy/ssh-action`, puis :
1. `git pull origin main` pour récupérer le code
2. `docker compose -f docker-compose.prod.yml build --no-cache` pour builder les images
3. `docker compose -f docker-compose.prod.yml up -d` pour redémarrer les containers
4. Nettoyage des anciennes images Docker
5. Vérification du healthcheck

**Architecture de production** :
- L'API tourne dans un container Node.js
- Le frontend est buildé par Vite puis servi par Nginx
- Nginx fait aussi reverse proxy : `/api/*` → container API
- Traefik gère le HTTPS et les certificats Let's Encrypt

### Monitoring des containers

Les containers de production sont supervisés via Portainer :

![Containers en production - Portainer](images/portainer.png)

Les 4 containers du stack `inno-event` (api, db, mongo, web) tournent sur le VPS, chacun isolé sur le réseau Docker interne.

## Configuration des secrets GitHub

Pour configurer les secrets dans GitHub :

1. Aller dans Settings > Secrets and variables > Actions
2. Ajouter les secrets suivants :

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | IP ou hostname du VPS |
| `VPS_USER` | Utilisateur SSH sur le VPS |
| `VPS_SSH_KEY` | Clé privée SSH (ed25519 ou rsa) |
| `VPS_PROJECT_PATH` | Chemin du projet sur le VPS (ex: `/opt/innovevents`) |

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

### Convention de commits

Le projet suit la convention **Conventional Commits** pour garder un historique lisible et cohérent. Chaque message de commit commence par un préfixe qui indique la nature du changement :

| Préfixe | Usage | Exemple |
|---------|-------|---------|
| `feat` | Nouvelle fonctionnalité | `feat: ajout page espace employé` |
| `fix` | Correction de bug | `fix: correction calcul TVA devis > 999€` |
| `docs` | Documentation uniquement | `docs: mise à jour workflow devis` |
| `test` | Ajout ou modification de tests | `test: ajout tests devis et events` |
| `chore` | Maintenance technique (dépendances, config, lock files...) | `chore: sync package-lock.json` |
| `ci` | Changements CI/CD | `ci: mise à jour pipeline GitHub Actions` |

Les messages sont rédigés en français, de manière claire et concise.

### Processus de développement

1. Créer une branche depuis `dev` : `git checkout -b feature/ma-fonctionnalite`
2. Développer et commiter (en respectant la convention ci-dessus)
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

En cas de besoin, le déploiement peut être effectué manuellement en SSH sur le VPS :

```bash
ssh user@vps-host
cd /opt/innovevents
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
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
