# Documentation - Système d'Authentification

## Vue d'ensemble

Le système d'authentification d'Innov'Events Manager repose sur JWT (JSON Web Tokens) pour gérer les sessions utilisateurs de manière sécurisée et stateless.

## Architecture

### Côté Backend (API Node.js/Express)

**Fichiers concernés :**
- `src/routes/auth.js` - Routes d'authentification
- `src/middlewares/auth.js` - Middlewares de protection
- `docs/database/003_users.sql` - Script SQL de création de la table

### Côté Frontend (React)

**Fichiers concernés :**
- `src/contexts/AuthContext.jsx` - Contexte global d'authentification
- `src/pages/Login.jsx` - Page de connexion
- `src/pages/Register.jsx` - Page d'inscription
- `src/layouts/AppLayout.jsx` - Layout avec menu conditionnel

---

## Base de données

### Table `users`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Rôles disponibles

| Rôle | Description |
|------|-------------|
| `admin` | Chloé - accès complet à l'application |
| `employe` | Équipe Innov'Events - accès consultation + notes |
| `client` | Clients - accès à leur espace personnel |

---

## Endpoints API

### POST `/api/auth/register` - Inscription

Crée un nouveau compte utilisateur (rôle `client` par défaut).

**Body :**
```json
{
  "email": "jean.dupont@exemple.com",
  "password": "MonMotDePasse1!",
  "firstname": "Jean",
  "lastname": "Dupont"
}
```

**Réponse succès (201) :**
```json
{
  "message": "Compte cree avec succes",
  "user": {
    "id": 1,
    "email": "jean.dupont@exemple.com",
    "firstname": "Jean",
    "lastname": "Dupont",
    "role": "client"
  }
}
```

**Validation du mot de passe :**
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial (!@#$%^&*...)

---

### POST `/api/auth/login` - Connexion

Authentifie un utilisateur et retourne un token JWT.

**Body :**
```json
{
  "email": "jean.dupont@exemple.com",
  "password": "MonMotDePasse1!"
}
```

**Réponse succès (200) :**
```json
{
  "message": "Connexion reussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "jean.dupont@exemple.com",
    "firstname": "Jean",
    "lastname": "Dupont",
    "role": "client",
    "mustChangePassword": false
  }
}
```

**Journalisation :**
- Connexion réussie → log avec IP
- Connexion échouée → log avec email, IP et raison

---

### POST `/api/auth/forgot-password` - Mot de passe oublié

Génère un nouveau mot de passe temporaire.

**Body :**
```json
{
  "email": "jean.dupont@exemple.com"
}
```

**Réponse (toujours 200 pour éviter l'énumération) :**
```json
{
  "message": "Si cet email existe, un nouveau mot de passe a ete envoye"
}
```

**Comportement :**
1. Génère un mot de passe aléatoire (format : `XX0000xx!`)
2. Met à jour le hash en base
3. Active le flag `must_change_password`
4. TODO: Envoie l'email (pour l'instant log en console)

---

### POST `/api/auth/change-password` - Changer son mot de passe

Permet à un utilisateur connecté de changer son mot de passe.

**Headers :**
```
Authorization: Bearer <token>
```

**Body :**
```json
{
  "currentPassword": "AncienMotDePasse1!",
  "newPassword": "NouveauMotDePasse2@"
}
```

---

### GET `/api/auth/me` - Profil utilisateur

Récupère les informations de l'utilisateur connecté.

**Headers :**
```
Authorization: Bearer <token>
```

---

## Middlewares de protection

### `authRequired`

Vérifie que l'utilisateur est connecté.

```javascript
const { authRequired } = require("./middlewares/auth");

router.get("/protected", authRequired, (req, res) => {
  // req.user contient { id, email, role }
  res.json({ user: req.user });
});
```

### `roleRequired`

Vérifie que l'utilisateur a le bon rôle.

```javascript
const { roleRequired } = require("./middlewares/auth");

// Un seul role
router.get("/admin-only", roleRequired("admin"), handler);

// Plusieurs roles
router.get("/staff", roleRequired(["admin", "employe"]), handler);
```

### `authOptional`

Ajoute `req.user` si connecté, mais ne bloque pas.

```javascript
const { authOptional } = require("./middlewares/auth");

router.get("/public", authOptional, (req, res) => {
  if (req.user) {
    // Utilisateur connecté
  } else {
    // Visiteur
  }
});
```

---

## Côté Frontend

### AuthContext

Le contexte fournit :

```javascript
const {
  user,              // Objet utilisateur ou null
  token,             // Token JWT ou null
  loading,           // Boolean pendant la vérification initiale
  isAuthenticated,   // Boolean
  isAdmin,           // Boolean
  isEmploye,         // Boolean
  isClient,          // Boolean
  login,             // Fonction async (email, password)
  register,          // Fonction async (userData)
  logout,            // Fonction sync
  forgotPassword,    // Fonction async (email)
  changePassword     // Fonction async (current, new)
} = useAuth();
```

### Utilisation dans un composant

```jsx
import { useAuth } from "../contexts/AuthContext";

function MonComposant() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Veuillez vous connecter</p>;
  }

  return (
    <div>
      <p>Bonjour {user.firstname} !</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

---

## Sécurité

### Hashage des mots de passe

- Algorithme : bcrypt
- Salt rounds : 10
- Le mot de passe en clair n'est jamais stocké

### Tokens JWT

- Secret : variable d'environnement `JWT_SECRET`
- Expiration : 24 heures
- Payload : `{ userId, email, role }`

### Bonnes pratiques appliquées

1. **Validation stricte** des entrées côté serveur
2. **Messages d'erreur génériques** pour éviter l'énumération
3. **Journalisation** des tentatives de connexion (succès et échecs)
4. **Compte désactivable** via `is_active`
5. **Forçage de changement** de mot de passe via `must_change_password`

---

## TODO

- [ ] Implémenter l'envoi d'emails (confirmation, mot de passe oublié)
- [ ] Ajouter rate limiting sur les routes d'auth
- [ ] Créer le compte admin par défaut au premier lancement
- [ ] Ajouter refresh token pour éviter la déconnexion automatique
