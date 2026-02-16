# Documentation API

L'API est construite avec Express.js. Toutes les routes commencent par `/api`.

## Authentification

L'API utilise des tokens JWT. Pour les routes protégées il faut envoyer le token dans le header :

```
Authorization: Bearer <token>
```

Le token expire après 24h. Il contient l'id de l'utilisateur, son email et son rôle.

## Routes publiques

Ces routes sont accessibles sans authentification.

### Santé

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Vérifie que l'API tourne |
| GET | `/api/hello` | Message de test |

### Auth

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/forgot-password` | Mot de passe oublié |

**POST /api/auth/register**

```json
{
  "email": "test@example.com",
  "password": "MonMotDePasse123!",
  "firstname": "Jean",
  "lastname": "Dupont"
}
```

Le mot de passe doit faire au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un caractère spécial.

**POST /api/auth/login**

```json
{
  "email": "test@example.com",
  "password": "MonMotDePasse123!"
}
```

Réponse :
```json
{
  "message": "Connexion reussie",
  "token": "eyJhbG...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstname": "Jean",
    "lastname": "Dupont",
    "role": "client"
  }
}
```

### Prospects

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/prospects` | Créer une demande de devis |

**POST /api/prospects**

```json
{
  "company_name": "Ma Boîte",
  "firstname": "Jean",
  "lastname": "Dupont",
  "email": "jean@maboite.fr",
  "phone": "0612345678",
  "location": "Paris",
  "event_type": "seminaire",
  "event_date": "2026-06-15",
  "participants": 50,
  "message": "On aimerait organiser un séminaire..."
}
```

### Événements publics

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/events/public` | Liste des événements publics |

### Contact

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/contact` | Envoyer un message de contact |

### Avis

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/reviews/public` | Avis validés et publics |

## Routes protégées (auth requise)

### Profil

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/auth/me` | Mon profil |
| POST | `/api/auth/change-password` | Changer mon mot de passe |

### Clients

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/clients` | Liste des clients (admin/employé) |

## Routes admin

Ces routes nécessitent le rôle `admin`.

### Utilisateurs

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/users/stats/count` | Stats par rôle/statut |
| GET | `/api/users/:id` | Détail d'un utilisateur |
| POST | `/api/users` | Créer un utilisateur |
| PUT | `/api/users/:id` | Modifier un utilisateur |
| PATCH | `/api/users/:id/toggle-status` | Activer/désactiver |
| POST | `/api/users/:id/reset-password` | Reset mot de passe |

**GET /api/users**

Query params optionnels :
- `role` : filtrer par rôle (admin, employe, client)
- `status` : filtrer par statut (active, inactive)

**POST /api/users**

```json
{
  "email": "nouveau@example.com",
  "firstname": "Paul",
  "lastname": "Martin",
  "role": "employe"
}
```

Un mot de passe temporaire est généré automatiquement et retourné dans la réponse.

### Prospects (admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/prospects` | Liste des prospects |
| GET | `/api/prospects/:id` | Détail d'un prospect |
| PATCH | `/api/prospects/:id/status` | Changer le statut |
| POST | `/api/prospects/:id/convert` | Convertir en client |

### Devis

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/devis` | Liste des devis |
| GET | `/api/devis/:id` | Détail d'un devis |
| POST | `/api/devis` | Créer un devis |
| PUT | `/api/devis/:id` | Modifier un devis |
| POST | `/api/devis/:id/lignes` | Ajouter une ligne |
| PUT | `/api/devis/:id/lignes/:ligneId` | Modifier une ligne |
| DELETE | `/api/devis/:id/lignes/:ligneId` | Supprimer une ligne |
| PATCH | `/api/devis/:id/send` | Envoyer le devis |
| GET | `/api/devis/:id/pdf` | Télécharger le PDF |

**Statuts de devis** : brouillon, envoye, en_etude, modification, accepte, refuse

### Événements (admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/events` | Liste des événements |
| GET | `/api/events/:id` | Détail d'un événement |
| POST | `/api/events` | Créer un événement |
| PUT | `/api/events/:id` | Modifier un événement |
| DELETE | `/api/events/:id` | Supprimer un événement |

### Notes et tâches

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/events/:id/notes` | Notes d'un événement |
| POST | `/api/events/:id/notes` | Ajouter une note |
| GET | `/api/events/:id/tasks` | Tâches d'un événement |
| POST | `/api/events/:id/tasks` | Créer une tâche |
| PATCH | `/api/tasks/:id` | Modifier une tâche |

### Contact (admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/contact` | Liste des messages |
| PATCH | `/api/contact/:id/read` | Marquer comme lu |
| PATCH | `/api/contact/:id/archive` | Archiver |

### Avis (admin)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/reviews` | Tous les avis |
| PATCH | `/api/reviews/:id/validate` | Valider un avis |
| PATCH | `/api/reviews/:id/reject` | Rejeter un avis |

### Dashboard

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/dashboard/stats` | Statistiques générales |

## Routes client

Ces routes nécessitent le rôle `client`.

### Mes devis

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/devis/mine` | Mes devis |
| GET | `/api/devis/:id` | Voir un devis |
| PATCH | `/api/devis/:id/accept` | Accepter |
| PATCH | `/api/devis/:id/refuse` | Refuser |
| PATCH | `/api/devis/:id/request-modification` | Demander une modif |

### Mes avis

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/reviews` | Laisser un avis |

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Créé |
| 400 | Requête invalide (champs manquants, validation) |
| 401 | Non authentifié (token manquant ou invalide) |
| 403 | Accès refusé (pas les droits) |
| 404 | Ressource non trouvée |
| 409 | Conflit (email déjà utilisé par exemple) |
| 500 | Erreur serveur |

Les erreurs retournent toujours un objet avec une clé `error` :

```json
{
  "error": "Email ou mot de passe incorrect"
}
```

## Middlewares

### authRequired

Vérifie que le token JWT est présent et valide. Ajoute `req.user` avec les infos décodées.

### roleRequired(role)

Vérifie que l'utilisateur a le bon rôle. Doit être utilisé après `authRequired`.

```javascript
router.get("/users", authRequired, roleRequired("admin"), (req, res) => {
  // Seulement les admins arrivent ici
});
```

### authOptional

Comme `authRequired` mais ne bloque pas si pas de token. Utile pour les routes qui changent de comportement selon si l'user est connecté ou non.
