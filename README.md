# Innov'Events Manager

Application web de gestion pour l'agence evenementielle Innov'Events. Elle permet de gerer les prospects, clients, devis et evenements.

Le projet est developpe dans le cadre du TP de developpement fullstack. L'objectif etait de remplacer le systeme actuel base sur Excel et Word par une vraie application web.

## Stack technique

**Backend**
- Node.js avec Express
- PostgreSQL pour les donnees metier
- MongoDB pour la journalisation des actions
- JWT pour l'authentification
- PDFKit pour la generation des devis PDF

**Frontend**
- React 19 avec Vite
- React Router v7 pour la navigation
- Bootstrap 5 pour le style et les composants UI

**Infra**
- Docker et Docker Compose
- 5 containers : api, web, postgres, mongo, mobile
- Traefik comme reverse proxy / edge proxy (production)
- Nginx pour servir le build React (dans le container web)

## Organisation du projet

```
innovevents-manager/
├── apps/
│   ├── api/                 # Backend Express
│   │   ├── src/
│   │   │   ├── routes/      # Routes API (auth, users, events, devis...)
│   │   │   ├── middlewares/  # Auth, validation
│   │   │   ├── db/          # Connexions PostgreSQL et MongoDB
│   │   │   └── utils/       # Helpers (generation PDF, mailer, validators)
│   │   └── __tests__/       # Tests Jest + Supertest
│   ├── web/                 # Frontend React
│   │   ├── src/
│   │   │   ├── pages/       # Composants de pages
│   │   │   ├── components/  # Composants reutilisables
│   │   │   ├── layouts/     # AppLayout (header + menu deroulant + footer)
│   │   │   ├── contexts/    # AuthContext
│   │   │   └── config.js    # URL API centralisee
│   │   ├── nginx.conf       # Config nginx production
│   │   └── Dockerfile
│   └── mobile/              # Frontend React Native / Expo
├── docs/                    # Documentation technique (01 a 18)
│   ├── database/            # Scripts SQL (001 a 008 + seed)
│   ├── images/              # Captures d'ecran
│   └── XX-nom-module.md     # Docs numerotees par theme
├── scripts/
│   └── deploy.sh            # Script de deploiement
├── docker-compose.yml       # Compose de developpement
├── docker-compose.prod.yml  # Compose de production
├── .env.production.example  # Template variables production
└── .github/
    └── workflows/           # Actions GitHub (CI/CD)
```

## Lancer le projet

### Avec Docker (recommande)

```bash
# Cloner le repo
git clone <url>
cd innovevents-manager

# Lancer tous les services
docker compose up --build

# Premiere fois : creer les tables
docker exec -i $(docker ps -qf "name=db") psql -U postgres -d innovevents < docs/database/001_create_tables.sql
# Repeter pour 002, 003... jusqu'a 008
# Puis charger les donnees de test :
docker exec -i $(docker ps -qf "name=db") psql -U postgres -d innovevents < docs/database/seed.sql
```

L'appli est accessible sur :
- Frontend : http://localhost:5173
- API : http://localhost:3000
- PostgreSQL : localhost:5433
- MongoDB : localhost:27017

### Sans Docker

On peut aussi lancer chaque service separement. Il faut avoir PostgreSQL et MongoDB installes localement.

```bash
# Configurer les variables d'environnement
cp .env.production.example .env
# Editer .env avec les valeurs locales

# API
cd apps/api
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

L'application est ensuite accessible via le domaine configure dans Traefik (Traefik route les requetes vers le container nginx, qui sert le frontend et fait proxy vers l'API).

## Comptes de test

| Email | Mot de passe | Role |
|-------|--------------|------|
| chloe.durand@innovevents.com | Password123! | Admin |
| maxime.leroy@innovevents.com | Password123! | Employe |
| yvan.martin@techcorp.fr | Password123! | Client |

Voir `docs/17-comptes-test.md` pour la liste complete (6 comptes).

## Tests

Les tests sont ecrits avec Jest et Supertest. Ils couvrent l'authentification, la gestion des utilisateurs, les devis et les evenements.

```bash
cd apps/api
npm test
```

Plus de 70 tests repartis sur 4 fichiers (auth, users, devis, events). La doc des tests est dans `__tests__/TESTS.md`.

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

- Authentification JWT avec tokens signes et expiration (24h)
- Mots de passe hashes avec bcrypt (salt rounds = 10)
- CORS restreint aux origines autorisees
- Rate limiting sur les endpoints sensibles (auth : 10 req/15min, global : 100 req/15min)
- Parametres SQL prepares (protection injection SQL)
- Helmet.js pour les headers HTTP
- RGPD : suppression de compte et anonymisation des donnees personnelles

Voir `docs/12-securite.md` pour le detail complet.

## Fonctionnalites principales

### Cote public
- Page d'accueil avec presentation de l'agence et statistiques
- Catalogue des evenements avec filtres (type, theme, date)
- Page d'avis clients avec soumission et statistiques
- Formulaire de demande de devis
- Page de contact
- Inscription et connexion

### Espace admin
- Dashboard avec KPI (prospects, clients, devis, CA, evenements)
- Gestion des prospects (liste, filtre par statut, conversion en client)
- Gestion des devis (creation, lignes de prestation, envoi, PDF)
- Gestion des evenements (CRUD, prestations, notes collaboratives, taches)
- Moderation des avis clients
- Boite de reception des messages de contact
- Gestion des utilisateurs (CRUD, activation/desactivation, reset MDP)

### Espace employe
- Dashboard avec taches assignees et evenements a venir
- Moderation des avis clients
- Notes et taches sur les evenements

### Espace client
- Dashboard avec statistiques devis et prochain evenement
- Consulter ses devis
- Accepter, refuser ou demander une modification de devis
- Laisser un avis

## Base de donnees

Le MCD complet est documente dans `docs/07-mcd.md`. Les tables principales :

- **prospects** : demandes de devis entrantes
- **clients** : clients convertis depuis les prospects
- **users** : comptes utilisateurs (admin, employe, client)
- **events** : evenements avec prestations, notes et taches
- **devis** : devis avec lignes de detail
- **contact_messages** : messages du formulaire de contact
- **reviews** : avis clients avec moderation

Les scripts SQL sont dans `docs/database/` et numerotes dans l'ordre d'execution (001 a 008 + seed).

## Journalisation

Toutes les actions importantes sont loguees dans MongoDB (collection `logs`). On trace :
- Les connexions reussies et echouees
- La creation/modification d'utilisateurs
- Les changements de statut des devis
- La creation d'evenements
- Les actions RGPD (suppression de compte)

Cela permet de garder un historique complet et de detecter les comportements anormaux.

## Problemes rencontres

Quelques problemes rencontres pendant le developpement :

**Bug des montants > 999 EUR dans les PDF**

Les montants s'affichaient mal dans les PDF generes. Par exemple "1 200 EUR" devenait "1/200 EUR". Le probleme venait de `toLocaleString("fr-FR")` qui utilise des espaces insecables comme separateur de milliers, mal interpretes par PDFKit. On a reecrit la fonction `formatMoney()` avec un formatage manuel.

**Tests qui reinitialisent le compte admin**

Un test pour la fonctionnalite "mot de passe oublie" utilisait le vrai compte admin au lieu d'un utilisateur de test. A chaque lancement des tests, le mot de passe admin etait reinitialise. La solution : toujours utiliser des comptes de test dedies.

## Ameliorations possibles

Quelques pistes d'amelioration identifiees :
- Application mobile plus complete (actuellement en version squelette)
- Tests plus couvrants (prospects, contact, reviews)

## Documentation

La doc technique est dans le dossier `docs/` au format Markdown. Pour une lecture confortable avec rendu des tableaux, diagrammes mermaid et images, on utilise l'extension VS Code **Markdown Preview Enhanced**.

Chaque module a son fichier :
- `01-creation-prospect.md` : flux de demande de devis
- `02-interface-admin-prospects.md` : interface admin prospects
- `03-authentification.md` : systeme JWT
- `04-evenements.md` : gestion des evenements
- `05-conversion-prospect-client.md` : processus de conversion
- `06-architecture.md` : architecture technique
- `07-mcd.md` : modele conceptuel de donnees
- `08-diagrammes.md` : diagrammes UML
- `09-wireframes.md` : maquettes de l'application
- `10-charte-graphique.md` : charte graphique et theme Minitel
- `11-api.md` : documentation API REST
- `12-securite.md` : securite et bonnes pratiques
- `13-workflow-devis.md` : cycle de vie complet d'un devis
- `14-emails.md` : systeme d'emails transactionnels
- `15-mobile.md` : application mobile React Native
- `16-cicd.md` : pipeline CI/CD et monitoring
- `17-comptes-test.md` : comptes de test et credentials
- `18-troubleshooting.md` : guide de depannage

## Kanban

Le suivi du projet est sur Notion : [Kanban Innov'Events](https://www.notion.so/2e69e1729b6980e28dc2dc39a8b54428?v=2e69e1729b69802ca4ca000c62b2ddc6)
