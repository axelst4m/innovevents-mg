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
- React 18 avec Vite
- React Router pour la navigation
- CSS vanilla (pas de framework CSS)

**Infra**
- Docker et Docker Compose
- 4 containers : api, web, postgres, mongo

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
│   └── web/                 # Frontend React
│       └── src/
│           ├── pages/       # Composants de pages
│           ├── components/  # Composants réutilisables
│           ├── layouts/     # Layouts (header, sidebar...)
│           └── contexts/    # AuthContext
├── docs/                    # Documentation technique
│   ├── database/            # Scripts SQL
│   └── *.md                 # Docs par module
└── docker-compose.yml
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

Tu peux lancer chaque service séparément. Il faut avoir PostgreSQL et MongoDB installés localement.

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

## Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@ino.fr | Admin123? | Admin |
| client@test.fr | Client123! | Client |

Voir `docs/COMPTES_TEST.md` pour plus de détails.

## Tests

Les tests sont écrits avec Jest et Supertest. Ils couvrent l'authentification et la gestion des utilisateurs.

```bash
cd apps/api
npm test
```

45 tests passent actuellement. La doc des tests est dans `__tests__/TESTS.md`.

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

Ça permet de garder un historique et de détecter les comportements anormaux.

## Galères rencontrées

Quelques problèmes qu'on a eus pendant le développement :

**Bug des montants > 999€ dans les PDF**

Les montants s'affichaient bizarrement dans les PDF générés. Par exemple "1 200 €" devenait "1/200 €" avec un slash au milieu. Le problème venait de `toLocaleString("fr-FR")` qui utilise des espaces insécables comme séparateur de milliers. PDFKit ne gère pas bien ces caractères. On a dû réécrire la fonction `formatMoney()` avec un formatage manuel.

**Tests qui cassent le compte admin**

Un de nos tests pour la fonctionnalité "mot de passe oublié" utilisait le vrai compte admin (admin@ino.fr) au lieu d'un utilisateur de test. Du coup à chaque fois qu'on lançait les tests le mot de passe admin était réinitialisé et on ne pouvait plus se connecter. On s'en est rendu compte après plusieurs "mais pourquoi ça marche plus ?!". La solution : toujours utiliser des comptes de test créés exprès pour ça.

## Ce qui reste à faire

Quelques trucs qu'on n'a pas eu le temps de finir :
- Envoi d'emails (le code est prêt mais pas connecté à un service SMTP)
- Application mobile
- CI/CD
- Rate limiting sur l'API

## Documentation

La doc technique est dans le dossier `docs/`. Chaque module a son fichier :
- `01-creation_prospect.md` : flux de demande de devis
- `02-interface_admin_prospects.md` : interface admin
- `03-authentification.md` : système JWT
- `04-evenements.md` : gestion des événements
- `05-05-conversion_prospect_client`: Processus de conversio prospect => client
- `WORKFLOW_DEVIS.md` : cycle de vie complet d'un devis

## Kanban

Le suivi du projet est sur Notion : [Kanban Innov'Events](https://www.notion.so/2e69e1729b6980e28dc2dc39a8b54428?v=2e69e1729b69802ca4ca000c62b2ddc6)
