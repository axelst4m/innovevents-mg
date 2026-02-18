# Innov'Events Manager

Application web de gestion pour l'agence événementielle Innov'Events. Elle permet de gérer les prospects, clients, devis et événements.

Le projet est développé dans le cadre du TP de développement fullstack. L'objectif était de remplacer le système actuel basé sur Excel et Word par une vraie application web.

## Stack technique

**Backend**
- Node.js avec Express
- PostgreSQL pour les données métier
- MongoDB pour la journalisation des actions
- JWT pour l'authentification
- PDFKit pour la génération des devis PDF

**Frontend**
- React 19 avec Vite
- React Router v7 pour la navigation
- Bootstrap 5 pour le style et les composants UI

**Infra**
- Docker et Docker Compose
- 5 containers : api, web, postgres, mongo, mobile
- Nginx en reverse proxy (production)
- Traefik comme edge proxy (production)

## Organisation du projet

```
innovevents-manager/
├── apps/
│   ├── api/                 # Backend Express
│   │   ├── src/
│   │   │   ├── routes/      # Routes API (auth, users, events, devis...)
│   │   │   ├── middlewares/ # Auth, validation
│   │   │   ├── db/          # Connexions PostgreSQL et MongoDB
│   │   │   └── utils/       # Helpers (génération PDF)
│   │   └── __tests__/       # Tests Jest
│   ├── web/                 # Frontend React
│   │   ├── src/
│   │   │   ├── pages/       # Composants de pages
│   │   │   ├── components/  # Composants réutilisables
│   │   │   ├── layouts/     # Layouts (header, sidebar...)
│   │   │   ├── contexts/    # AuthContext
│   │   │   └── config.js    # URL API centralisée
│   │   ├── nginx.conf       # Config nginx production
│   │   └── Dockerfile
│   └── mobile/              # Frontend React Native
├── docs/                    # Documentation technique (01 à 18)
│   ├── database/            # Scripts SQL (001 à 008 + seed)
│   ├── images/              # Captures d'écran
│   └── XX-nom-module.md     # Docs numérotées par thème
├── scripts/
│   └── deploy.sh            # Script de déploiement
├── docker-compose.yml       # Compose de développement
├── docker-compose.prod.yml  # Compose de production
├── .env.production.example  # Template variables production
└── .github/
    └── workflows/           # Actions GitHub (CI/CD)
```

## Lancer le projet

### Avec Docker (recommandé)

```bash
# Cloner le repo
git clone <url>
cd innovevents-manager

# Lancer tous les services
docker compose up --build

# Première fois : créer les tables
docker exec -i $(docker ps -qf "name=db") psql -U postgres -d innovevents < docs/database/001_create_tables.sql
# Répéter pour 002, 003... jusqu'à 008
```

L'appli est accessible sur :
- Frontend : http://localhost:5173
- API : http://localhost:3000
- PostgreSQL : localhost:5432
- MongoDB : localhost:27017

### Sans Docker

On peut aussi lancer chaque service séparément. Il faut avoir PostgreSQL et MongoDB installés localement.

```bash
# API
cd apps/api
cp .env.example .env  # configurer les variables
npm install
npm run dev

# Frontend (dans un autre terminal)
cd apps/web
npm install
npm run dev
```

### Production (VPS avec Docker + Traefik)

```bash
# Cloner le repo sur le VPS
git clone <url>
cd innovevents-manager

# Configurer les variables d'environnement
cp .env.production.example .env
# Editer .env avec les valeurs de production

# Verifier que le reseau Traefik existe
docker network create web || true

# Lancer en production
docker compose -f docker-compose.prod.yml up -d --build
```

L'application est ensuite accessible via l'IP du VPS (Traefik route les requetes vers le container nginx, qui sert le frontend et fait proxy vers l'API).

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@ino.fr | Admin123? | Admin |
| client@test.fr | Client123! | Client |

Voir `docs/17-comptes-test.md` pour plus de détails.

## Tests

Les tests sont écrits avec Jest et Supertest. Ils couvrent l'authentification et la gestion des utilisateurs.

```bash
cd apps/api
npm test
```

45 tests passent actuellement. La doc des tests est dans `__tests__/TESTS.md`.

## CI/CD

Le projet utilise GitHub Actions pour l'integration et le deploiement continus.

**CI (`.github/workflows/ci.yml`)** : declenchee sur push/PR vers `dev` et `main`
- Tests API avec PostgreSQL et MongoDB en services
- Build du frontend
- Verification de l'app mobile

**CD (`.github/workflows/deploy.yml`)** : declenchee sur push vers `main`
- Execute les tests (CI)
- Deploie sur le VPS via SSH (git pull + docker compose build + up)

Secrets GitHub requis : `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PROJECT_PATH`

## Securite

- Authentification JWT avec tokens signes et expiration
- Mots de passe hashes avec bcrypt (salt rounds = 10)
- CORS restreint aux origines autorisees
- Rate limiting sur les endpoints sensibles (auth, contact)
- Parametres SQL prepares (protection injection SQL)
- Helmet.js pour les headers HTTP
- RGPD : suppression de compte et des donnees personnelles

Voir `docs/12-securite.md` pour le detail complet.

## Fonctionnalités principales

### Côté public
- Page d'accueil avec présentation de l'agence
- Catalogue des événements
- Formulaire de demande de devis
- Page de contact
- Inscription et connexion

### Espace admin
- Dashboard avec stats
- Gestion des prospects (liste, filtre par statut, conversion en client)
- Gestion des clients
- Création et envoi de devis (avec génération PDF)
- Gestion des événements
- Gestion des utilisateurs (CRUD complet)

### Espace client
- Voir ses devis
- Accepter ou refuser un devis
- Demander des modifications

## Base de données

Le MCD complet est documenté dans `docs/MCD.md`. Les tables principales :

- **prospects** : demandes de devis entrantes
- **clients** : clients convertis depuis les prospects
- **users** : comptes utilisateurs (admin, employé, client)
- **events** : événements avec leurs prestations
- **devis** : devis avec lignes de détail
- **contact_messages** : messages du formulaire de contact
- **reviews** : avis clients

Les scripts SQL sont dans `docs/database/` et numérotés dans l'ordre d'exécution.

## Journalisation

Toutes les actions importantes sont loguées dans MongoDB (collection `logs`). On trace :
- Les connexions réussies et échouées
- La création/modification d'utilisateurs
- Les changements de statut des devis
- La création d'événements

Cela permet de garder un historique complet et de détecter les comportements anormaux.

## Problèmes rencontrés

Quelques problèmes rencontrés pendant le développement :

**Bug des montants > 999€ dans les PDF**

Les montants s'affichaient mal dans les PDF générés. Par exemple "1 200 €" devenait "1/200 €". Le problème venait de `toLocaleString("fr-FR")` qui utilise des espaces insécables comme séparateur de milliers, mal interprétés par PDFKit. On a réécrit la fonction `formatMoney()` avec un formatage manuel.

**Tests qui réinitialisent le compte admin**

Un test pour la fonctionnalité "mot de passe oublié" utilisait le vrai compte admin au lieu d'un utilisateur de test. À chaque lancement des tests, le mot de passe admin était réinitialisé. La solution : toujours utiliser des comptes de test dédiés.

## Améliorations possibles

Quelques pistes d'amélioration identifiées :
- Application mobile plus complète (actuellement en version squelette)
- Tests plus couvrants (devis, events, prospects)

## Documentation

La doc technique est dans le dossier `docs/`. Chaque module a son fichier :
- `01-creation_prospect.md` : flux de demande de devis
- `02-interface_admin_prospects.md` : interface admin
- `03-authentification.md` : système JWT
- `04-evenements.md` : gestion des événements
- `05-05-conversion_prospect_client.md` : Processus de conversion prospect => client
- `13-workflow-devis.md` : cycle de vie complet d'un devis
- `12-securite.md` : sécurité et bonnes pratiques
- `06-architecture.md` : architecture technique
- `17-comptes-test.md` : comptes de test et credentials
- `16-cicd.md` : pipeline CI/CD

## Kanban

Le suivi du projet est sur Notion : [Kanban Innov'Events](https://www.notion.so/2e69e1729b6980e28dc2dc39a8b54428?v=2e69e1729b69802ca4ca000c62b2ddc6)
