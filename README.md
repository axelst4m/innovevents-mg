Avancement Kanban : https://www.notion.so/2e69e1729b6980e28dc2dc39a8b54428?v=2e69e1729b69802ca4ca000c62b2ddc6

# Innov'Events Manager

Gestion d'événements — application fullstack minimale composée d'une API Node/Express et d'une interface web React + Vite. Le projet est organisé sous `apps/` et prêt à être lancé localement via Docker Compose pour reproduire un environnement de développement avec Postgres et MongoDB.

**Structure**
- `apps/api`: API Express (CommonJS). Points d'entrée : `src/index.js`.
- `apps/web`: Application frontend React + Vite.
- `docker-compose.yml`: composition pour `api`, `web`, `db` (Postgres) et `mongo`.

**Prérequis**
- Docker & Docker Compose installés.
- (Optionnel) Node.js & npm/yarn pour exécuter chaque partie localement sans Docker.

**Démarrage rapide (Docker)**
1. À la racine du projet, lancer :

```bash
docker compose up --build
```

2. Services exposés par défaut :
- API : http://localhost:3000
- Web : http://localhost:5173
- Postgres : 5432
- Mongo : 27017

Variables d'environnement principales (définies dans `docker-compose.yml`) :
- `PORT` (API)
- `DATABASE_URL` (Postgres)
- `MONGO_URL` (MongoDB)
- `VITE_API_URL` (frontend)

**Développement local sans Docker**

API

```bash
cd apps/api
npm install
npm run dev   # lance nodemon src/index.js
```

Frontend

```bash
cd apps/web
npm install
npm run dev   # lance Vite (port 5173)
```

Assurez-vous de définir les variables d'environnement localement (par exemple via un fichier `.env` dans `apps/api`) si vous n'utilisez pas Docker.

**Endpoints utiles**
- `GET /health` → vérifie le statut de l'API (réponse `{ ok: true }`).
- `GET /api/hello` → message test : `Hello Innov'Events API`.

**Scripts**
- API (`apps/api/package.json`) : `dev`, `start`, `test` (placeholder).
- Web (`apps/web/package.json`) : `dev`, `build`, `preview`, `lint`.

**Contribuer**
- Ouvrez une issue pour proposer des fonctionnalités ou signaler des bugs.
- Soumettez des pull requests avec une description claire des changements.

**Licence**
- À définir (ajouter un fichier `LICENSE` si nécessaire).

---

Si vous voulez, je peux :
- ajouter un exemple de `.env.example` pour l'API,
- automatiser l'installation des dépendances dans chaque dossier,
- ou créer des scripts Makefile pour simplifier les commandes Docker/local.
