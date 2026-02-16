# DOC TECHNIQUE — Création d’un prospect (Demande de devis)

Cette documentation décrit le fonctionnement technique de la fonctionnalité "Demande de devis" : du formulaire Front à l'insertion en base relationnelle et à la journalisation NoSQL.


## Objectif

Permettre à un visiteur du site Innov'Events de soumettre une demande de devis. La demande est enregistrée en tant que prospect avec un statut initial `a_contacter`.


## Vue d'ensemble

1. Le visiteur complète le formulaire de demande de devis sur la page dédiée.
2. Le Frontend (React) envoie une requête HTTP POST vers l'API.
3. L'API valide les données reçues.
4. Les informations sont insérées dans PostgreSQL (table `prospects`).
5. Une entrée de journalisation est ajoutée dans MongoDB.
6. L'API renvoie une réponse confirmant la prise en compte de la demande.


## Fichiers impliqués et rôles

- **Script SQL** — `docs/database/001_create_tables.sql`
  - Contient la création de la table `prospects` et les index.
- **Point d'entrée API** — `apps/api/src/index.js`
  - Initialise Express, configure les middlewares, monte les routes et démarre le serveur. Les routes métier sont sous le préfixe `/api`.
- **Route métier** — `apps/api/src/routes/prospects.js`
  - Validation des champs, insertion PostgreSQL, création du log MongoDB, gestion des réponses HTTP.
- **Connexion PostgreSQL** — `apps/api/src/db/postgres.js`
  - Instancie et partage un pool de connexions via la librairie `pg`.
- **Connexion MongoDB** — `apps/api/src/db/mongo.js`
  - Gère la connexion MongoDB centralisée et réutilisable.


## Table `prospects`

La table contient notamment :

- un identifiant technique (`id`),
- les informations de contact,
- les informations liées à l'événement demandé,
- un `statut` métier (par défaut `a_contacter`),
- une `created_at` automatique.


## Requête SQL utilisée lors de la création

L'API exécute un `INSERT ... RETURNING` pour récupérer immédiatement les champs générés (ex. `id`, `statut`, `created_at`).
Les valeurs sont passées en paramètres pour éviter les injections SQL.

Exemple d'utilisation dans le code :

```js
const { rows } = await pool.query(insertQuery, values);
const created = rows[0];
```

`rows` est un tableau retourné par PostgreSQL ; avec `RETURNING` il contient la ligne créée.


## Notion de pool de connexions

Le pool permet de réutiliser des connexions PostgreSQL :

- Sans pool : chaque requête ouvrirait une nouvelle connexion (latence, saturation).
- Avec pool : les connexions sont ouvertes une fois et empruntées/rendues selon les requêtes.

Cela améliore performances et stabilité.


## Utilisation d'un ORM

Aucun ORM n'est utilisé : les requêtes SQL sont écrites manuellement et exécutées via `pg`. Ce choix favorise la lisibilité et le contrôle des requêtes.


## Journalisation No‑SQL

À chaque création de prospect, une entrée est ajoutée dans MongoDB pour tracer l'action. La journalisation est non bloquante : une erreur MongoDB ne doit pas empêcher la création SQL du prospect.


## Vérifications et tests

- Vérifier la création de la table via `psql`.
- Tester l'endpoint avec `curl` ou Postman.
- Consulter les données en base PostgreSQL et les logs dans MongoDB.


## Perspectives d'évolution

- Ajouter un back-office pour qualifier les prospects.
- Envoi automatique d'emails de notification.
- Ajout de tests automatisés.
- Gestion du cycle de vie du prospect (conversion en client).
