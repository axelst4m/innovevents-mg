# Documentation API

L'API est construite avec Express.js. Toutes les routes commencent par `/api`.

## Authentification

L'API utilise des tokens JWT. Pour les routes protegees il faut envoyer le token dans le header :

```
Authorization: Bearer <token>
```

Le token expire apres 24h. Il contient l'id de l'utilisateur, son email et son role.

## Routes publiques

Ces routes sont accessibles sans authentification.

### Sante

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/health` | Verifie que l'API tourne |
| GET | `/api/hello` | Message de test |

### Auth

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Creer un compte |
| POST | `/api/auth/login` | Se connecter (rate limited: 10 req/15min) |
| POST | `/api/auth/forgot-password` | Mot de passe oublie (rate limited) |

**POST /api/auth/register**

```json
{
  "email": "test@example.com",
  "password": "MonMotDePasse123!",
  "firstname": "Jean",
  "lastname": "Dupont"
}
```

Le mot de passe doit faire au moins 8 caracteres avec une majuscule, une minuscule, un chiffre et un caractere special.

**POST /api/auth/login**

```json
{
  "email": "test@example.com",
  "password": "MonMotDePasse123!"
}
```

Reponse :
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

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/prospects` | Creer une demande de devis |

**POST /api/prospects**

```json
{
  "company_name": "Ma Boite",
  "firstname": "Jean",
  "lastname": "Dupont",
  "email": "jean@maboite.fr",
  "phone": "0612345678",
  "location": "Paris",
  "event_type": "seminaire",
  "event_date": "2026-06-15",
  "participants": 50,
  "message": "On aimerait organiser un seminaire..."
}
```

### Evenements publics

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/events` | Liste des evenements publics (filtre is_public) |
| GET | `/api/events/:id` | Detail d'un evenement (si public ou connecte) |
| GET | `/api/events/meta/types` | Liste des types d'evenements |
| GET | `/api/events/meta/statuses` | Liste des statuts possibles |

Query params pour GET /api/events : `type`, `theme`, `start_date`, `end_date`

### Contact

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/contact` | Envoyer un message de contact |

### Avis

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/reviews` | Avis valides et publics |
| POST | `/api/reviews` | Soumettre un avis (auth optionnelle) |

## Routes protegees (auth requise)

### Profil

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/auth/me` | Mon profil |
| POST | `/api/auth/change-password` | Changer mon mot de passe |
| DELETE | `/api/auth/account` | Supprimer mon compte (anonymisation RGPD) |
| GET | `/api/auth/users` | Liste des utilisateurs actifs (filtre par role) |

### Clients

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/clients` | Liste des clients |

## Routes admin

Ces routes necessitent le role `admin`.

### Utilisateurs

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/users` | Liste des utilisateurs |
| GET | `/api/users/stats/count` | Stats par role/statut |
| GET | `/api/users/:id` | Detail d'un utilisateur |
| POST | `/api/users` | Creer un utilisateur |
| PUT | `/api/users/:id` | Modifier un utilisateur |
| PATCH | `/api/users/:id/toggle-status` | Activer/desactiver |
| POST | `/api/users/:id/reset-password` | Reset mot de passe |

**GET /api/users**

Query params optionnels :
- `role` : filtrer par role (admin, employe, client)
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

Un mot de passe temporaire est genere automatiquement et retourne dans la reponse.

### Prospects (admin)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/prospects` | Liste des prospects |
| GET | `/api/prospects/:id` | Detail d'un prospect |
| PATCH | `/api/prospects/:id/status` | Changer le statut |
| POST | `/api/prospects/:id/convert` | Convertir en client |

### Devis (admin)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/devis` | Liste des devis |
| GET | `/api/devis/:id` | Detail d'un devis |
| POST | `/api/devis` | Creer un devis |
| PUT | `/api/devis/:id` | Modifier un devis |
| POST | `/api/devis/:id/lignes` | Ajouter une ligne |
| DELETE | `/api/devis/:id/lignes/:ligneId` | Supprimer une ligne |
| POST | `/api/devis/:id/send` | Envoyer le devis au client |
| GET | `/api/devis/:id/pdf` | Telecharger le PDF |

**Statuts de devis** : brouillon, envoye, en_etude, modification, accepte, refuse

### Evenements (admin)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/events/admin` | Liste des evenements (vue admin, tous statuts) |
| POST | `/api/events` | Creer un evenement |
| PUT | `/api/events/:id` | Modifier un evenement |
| DELETE | `/api/events/:id` | Supprimer un evenement |
| POST | `/api/events/:id/prestations` | Ajouter une prestation |
| DELETE | `/api/events/:eventId/prestations/:prestationId` | Supprimer une prestation |

### Notes et taches (admin/employe)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/events/:id/notes` | Notes d'un evenement |
| POST | `/api/events/:id/notes` | Ajouter une note |
| DELETE | `/api/events/:id/notes/:noteId` | Supprimer une note |
| GET | `/api/events/:id/tasks` | Taches d'un evenement |
| POST | `/api/events/:id/tasks` | Creer une tache |
| PATCH | `/api/events/:eventId/tasks/:taskId` | Modifier une tache |
| DELETE | `/api/events/:eventId/tasks/:taskId` | Supprimer une tache |
| GET | `/api/tasks/my` | Mes taches assignees |

### Contact (admin)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/contact` | Liste des messages |
| GET | `/api/contact/:id` | Detail d'un message |
| PATCH | `/api/contact/:id` | Mettre a jour (lu/archive) |
| DELETE | `/api/contact/:id` | Supprimer un message |

### Avis (admin/employe)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/reviews/all` | Tous les avis |
| GET | `/api/reviews/pending` | Avis en attente de moderation |
| PATCH | `/api/reviews/:id/validate` | Valider un avis |
| PATCH | `/api/reviews/:id/reject` | Rejeter un avis |
| PATCH | `/api/reviews/:id/featured` | Mettre en avant (admin seulement) |
| DELETE | `/api/reviews/:id` | Supprimer un avis (admin seulement) |

### Dashboard

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/dashboard/stats` | Statistiques generales |

## Routes client

Ces routes necessitent le role `client`.

### Mes devis

| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/devis/client` | Mes devis |
| GET | `/api/devis/:id` | Voir un devis |
| POST | `/api/devis/:id/accept` | Accepter |
| POST | `/api/devis/:id/refuse` | Refuser |
| POST | `/api/devis/:id/request-modification` | Demander une modif |

### Mes avis

| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/reviews` | Laisser un avis |

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Cree |
| 400 | Requete invalide (champs manquants, validation) |
| 401 | Non authentifie (token manquant ou invalide) |
| 403 | Acces refuse (pas les droits) |
| 404 | Ressource non trouvee |
| 409 | Conflit (email deja utilise par exemple) |
| 500 | Erreur serveur |

Les erreurs retournent toujours un objet avec une cle `error` :

```json
{
  "error": "Email ou mot de passe incorrect"
}
```

## Middlewares

### authRequired

Verifie que le token JWT est present et valide. Ajoute `req.user` avec les infos decodees (id, email, role).

### roleRequired(role)

Verifie que l'utilisateur a le bon role. Accepte un string ou un tableau de roles. Doit etre utilise apres `authRequired`.

```javascript
router.get("/users", authRequired, roleRequired("admin"), (req, res) => {
  // Seulement les admins arrivent ici
});

router.get("/events/admin", authRequired, roleRequired(["admin", "employe"]), (req, res) => {
  // Admins et employes
});
```

### authOptional

Comme `authRequired` mais ne bloque pas si pas de token. Utile pour les routes qui changent de comportement selon si l'user est connecte ou non (ex: page evenements, soumission d'avis).
