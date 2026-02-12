# Documentation de Sécurité - Innov'Events Manager

**Projet :** TP Concepteur Développeur d'Applications
**Date :** 2024-2025
**Version :** 1.0

---

## 1. Authentification

### 1.1 Authentification JWT

L'application utilise les **JSON Web Tokens (JWT)** pour gérer les sessions utilisateurs.

- **Secret JWT** : Stocké dans la variable d'environnement `JWT_SECRET` (utiliser `.env` en production)
- **Durée d'expiration** : 24 heures (`JWT_EXPIRES_IN = "24h"`)
- **Structure du token** : Contient `userId`, `email` et `role`
- **Transmission** : Via le header `Authorization: Bearer <token>`

**Localisation du code** : `/apps/api/src/routes/auth.js` (lignes 21-23, 220-228)

### 1.2 Hashage des mots de passe - bcrypt

Les mots de passe sont sécurisés avec **bcryptjs** :

- **Nombre de rounds** : 10 (salt rounds)
- **Processus** : Chaque mot de passe est hasté avec un salt unique avant stockage
- **Vérification** : `bcrypt.compare()` compare le mot de passe saisi au hash stocké
- **Jamais en clair** : Les mots de passe ne sont jamais stockés en texte brut

**Localisation du code** : Lignes 104-106, 299-300, 387-388 dans `auth.js`

### 1.3 Règles de validation des mots de passe

Les mots de passe doivent respecter une politique de complexité stricte :

| Critère | Exigence |
|---------|----------|
| **Longueur minimale** | 8 caractères |
| **Majuscules** | Au moins 1 |
| **Minuscules** | Au moins 1 |
| **Chiffres** | Au moins 1 |
| **Caractères spéciaux** | Au moins 1 parmi `!@#$%^&*(),.?":{}|<>` |

**Localisation du code** : Fonction `validatePassword()` aux lignes 29-43

### 1.4 Endpoints d'authentification

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/register` | POST | Inscription d'un nouvel utilisateur |
| `/api/auth/login` | POST | Connexion et génération du token JWT |
| `/api/auth/forgot-password` | POST | Réinitialisation du mot de passe |
| `/api/auth/change-password` | POST | Changement du mot de passe (authentifié) |
| `/api/auth/me` | GET | Récupération du profil utilisateur |

### 1.5 Gestion des mots de passe temporaires

- Lors d'une réinitialisation, un mot de passe **temporaire aléatoire** est généré
- Format : 2 lettres majuscules + 4 chiffres + 2 lettres minuscules + 1 caractère spécial
- Un flag `must_change_password = TRUE` force l'utilisateur à le changer à la prochaine connexion

---

## 2. Autorisation et Contrôle d'accès

### 2.1 Modèle de rôles

L'application implémente un contrôle d'accès basé sur les rôles (RBAC) :

| Rôle | Permissions | Utilisation |
|------|-------------|-------------|
| **admin** | Accès complet à toutes les ressources | Administrateurs système |
| **employe** | Gestion des événements et devis | Équipe interne |
| **client** | Accès à ses propres dévis et événements | Clients externes |

**Localisation du code** : Middleware dans `/apps/api/src/middlewares/auth.js`

### 2.2 Middlewares d'autorisation

```javascript
// authRequired : Vérifie l'authentification
app.use(authRequired)

// roleRequired : Vérifie le rôle spécifié
app.use(roleRequired("admin"))
app.use(roleRequired(["admin", "employe"]))

// authOptional : Authentification facultative
app.use(authOptional)
```

**Localisation du code** : `/apps/api/src/middlewares/auth.js` (lignes 9-96)

### 2.3 Contrôle d'accès dans les routes

- Les endpoints sensibles nécessitent une authentification via `authRequired`
- Les opérations administratives nécessitent `roleRequired("admin")`
- Chaque requête extraite du token JWT le rôle et l'identifiant utilisateur

**Exemple** : La route `/api/auth/users` (ligne 450-502 dans `auth.js`) restreint l'accès aux rôles `admin` et `employe` uniquement.

---

## 3. Protection des routes

### 3.1 Middleware d'authentification côté API

Toutes les routes protégées vérifient le token JWT présent dans le header `Authorization` :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Si le token est absent, invalide ou expiré, la réponse est `401 Unauthorized`.

**Localisation du code** : Middleware dans `/apps/api/src/middlewares/auth.js`

### 3.2 Protection côté frontend

Le frontend implémente un composant `ProtectedRoute` qui :
- Vérifie la présence d'un token dans le localStorage
- Redirige vers la page de connexion si non authentifié
- Gère les vérifications de rôles avant affichage

### 3.3 Extraction d'informations du token

Le token JWT est extrait du header `Authorization` en supprimant le préfixe `"Bearer "` :

```javascript
const token = authHeader.split(" ")[1];
const decoded = jwt.verify(token, JWT_SECRET);
```

---

## 4. Protection contre les attaques courantes

### 4.1 Protection CORS

Une liste blanche de domaines autorisés est définie dans `/apps/api/src/app.js` :

```javascript
const allowedOrigins = [
  "http://localhost:5173",    // Vite dev
  "http://localhost:3000",    // API (same-origin)
  process.env.FRONTEND_URL    // Production
]
```

**Politique** :
- Seules les origines de la liste blanche peuvent accéder à l'API
- Les requêtes sans origin (curl, Postman, applications mobiles) sont autorisées
- Les requêtes d'origines non autorisées sont rejetées avec l'erreur "Origine non autorisée par CORS"

**Localisation du code** : `/apps/api/src/app.js` (lignes 21-59)

### 4.2 Rate limiting

Deux niveaux de limitation de débit protègent contre les attaques par brute-force :

#### Limiteur global
- **Limite** : 100 requêtes par 15 minutes par IP
- **Scope** : Toutes les requêtes
- **Désactivé en test** pour ne pas bloquer les tests automatisés

#### Limiteur d'authentification (strict)
- **Limite** : 10 requêtes par 15 minutes
- **Scope** : Routes `/api/auth/login` et `/api/auth/forgot-password`
- **Protège contre** : Attaques par brute-force sur les mots de passe

**Localisation du code** : `/apps/api/src/app.js` (lignes 28-46, 61)

### 4.3 Protection contre l'injection SQL

Toutes les requêtes à PostgreSQL utilisent des **requêtes paramétrées** :

```javascript
const result = await pool.query(
  "SELECT id FROM users WHERE email = $1",
  [email.toLowerCase()]
);
```

Les paramètres (`$1`, `$2`, etc.) sont séparés des requêtes SQL, empêchant toute injection.

**Localisation du code** : Partout dans `auth.js` et les autres routes

### 4.4 Protection contre l'injection XSS

React échappe automatiquement le contenu affiché pour prévenir les attaques XSS :
- Les données utilisateur interpolées dans le JSX sont échappées
- Les balises HTML sont converties en texte
- Les événements inline ne sont pas exécutés

### 4.5 Helmet - Sécurité des headers HTTP

Helmet ajoute des headers de sécurité essentiels :

```javascript
app.use(helmet());
```

Headers ajoutés :
- `X-Frame-Options: DENY` (Protection contre le clickjacking)
- `X-Content-Type-Options: nosniff` (Force le respect du Content-Type)
- `Content-Security-Policy` (Restriction des sources autorisées)
- `Strict-Transport-Security` (HTTPS obligatoire en production)

**Localisation du code** : `/apps/api/src/app.js` (ligne 48)

---

## 5. Stockage des données sensibles

### 5.1 Mots de passe

- **Stockage** : Hash bcrypt avec 10 salt rounds
- **Format** : Jamais en clair, toujours hashé
- **Vérification** : Utilisation de `bcrypt.compare()` pour comparaison sécurisée
- **Pas de réversibilité** : Impossible de récupérer le mot de passe d'origine

### 5.2 JWT Secret

```javascript
const JWT_SECRET = process.env.JWT_SECRET || "innov_events_secret_key_2024";
```

**Bonnes pratiques** :
- En développement : Clé par défaut fournie
- En production : **OBLIGATOIREMENT** stocker dans `.env` (variable d'environnement)
- Ne **jamais** commiter le `.env` dans Git
- Changer régulièrement la clé en production

### 5.3 Données personnelles

Aucune donnée sensible n'est stockée en clair :
- Emails : Valides mais non exposés dans les logs
- Noms/Prénoms : Stockés tels quels mais protégés par authentification
- Adresses IP : Loggées en cas d'authentification échouée (audit de sécurité)

### 5.4 Stockage sécurisé sur mobile (AsyncStorage)

Si utilisé pour une application mobile, le token JWT doit être stocké avec sécurité :
- Utiliser `react-native-secure-store` plutôt que `AsyncStorage` simple
- Chiffrer les données sensibles
- Implémenter le logout pour supprimer les tokens du stockage

---

## 6. RGPD - Conformité Données Personnelles

### 6.1 Droit à l'oubli (Droit à la suppression)

Route `DELETE /api/auth/account` implémente la suppression de compte :

**Processus** :
1. Vérification du token JWT
2. Confirmation par le mot de passe actuel
3. **Anonymisation** (non suppression) des données :
   - Email → `deleted_{userId}@anonymized.com`
   - Prénom/Nom → "Utilisateur supprimé"
   - Statut `is_active` → `FALSE`

**Données liées anonymisées** :
- Clients associés au compte
- Devis des clients
- Avis/reviews des dévis

**Localisation du code** : `/apps/api/src/routes/auth.js` (lignes 508-611)

### 6.2 Minimisation des données

- **Collecte minimale** : Seules les données nécessaires sont collectées (email, nom, prénom)
- **Pas de suivi** : Pas de cookies de suivi ou analytics non consentis
- **Archivage** : Les logs sont conservés pour audit, non pour marketing

### 6.3 Consentement utilisateur

À l'inscription, l'utilisateur doit accepter :
- Les conditions d'utilisation
- La politique de confidentialité
- La collecte de données (à implémenter via checkbox)

### 6.4 Portabilité des données

Un endpoint `/api/auth/export` pourrait être ajouté pour exporter les données personnelles en JSON/CSV (à implémenter).

---

## 7. Journalisation et audit

### 7.1 Logging des événements de sécurité

Les événements sensibles sont loggés dans MongoDB dans la collection `logs` :

```javascript
async function logAction(type_action, userId, details) {
  await db.collection("logs").insertOne({
    horodatage: new Date(),
    type_action,
    id_utilisateur: userId,
    details
  });
}
```

**Localisation du code** : `/apps/api/src/routes/auth.js` (lignes 56-68)

### 7.2 Types d'événements loggés

| Événement | Détails | Sens de sécurité |
|-----------|---------|------------------|
| `CREATION_COMPTE` | Email, rôle, client lié | Audit d'inscription |
| `CONNEXION_REUSSIE` | IP cliente, timestamp | Trace d'accès |
| `CONNEXION_ECHOUEE` | Email, IP, raison | Détection d'attaques |
| `MOT_DE_PASSE_REINITIALISE` | Email, timestamp | Audit de sécurité |
| `CHANGEMENT_MOT_DE_PASSE` | Timestamp | Audit de changement |
| `SUPPRESSION_COMPTE` | Clients anonymisés | Audit de suppression |

### 7.3 Informations loggées en cas d'échec d'authentification

```javascript
await logAction("CONNEXION_ECHOUEE", user.id, {
  email: user.email,
  ip: clientIp,
  raison: "Mot de passe incorrect"
});
```

Cela permet de :
- Détecter les attaques par brute-force
- Identifier les adresses IP suspectes
- Analyser les tentatives de connexion échouées

### 7.4 Accès aux logs

Les logs MongoDB doivent être :
- Accessibles uniquement aux administrateurs
- Préservés pour une durée légale (3 ans minimum)
- Chiffrés en transit et au repos (en production)

---

## 8. Améliorations possibles et recommandations

### 8.1 HTTPS obligatoire en production

**Action requise** :
```javascript
// Dans app.js (à ajouter en prod)
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

- Rediriger tout trafic HTTP vers HTTPS
- Obtenir un certificat SSL (Let's Encrypt gratuit)
- Implémenter HSTS (Strict-Transport-Security)

### 8.2 Authentification multi-facteurs (2FA)

Prochaine phase de sécurisation :
- Code TOTP (Time-based One-Time Password) via authenticateur
- Codes de secours stockés de manière sécurisée
- Sauvegarde du secret 2FA chiffré

**Lib recommandée** : `speakeasy`, `qrcode`

### 8.3 Refresh tokens

Implémenter une rotation de tokens :
- Token d'accès court terme (15 minutes)
- Refresh token long terme (7 jours)
- Renouvellement automatique sans reconnecter l'utilisateur

**Route** : `POST /api/auth/refresh`

### 8.4 Content Security Policy (CSP) améliorée

Ajouter une CSP stricte pour limiter les sources de contenu :

```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // À affiner
    imgSrc: ["'self'", "data:", "https:"],
  }
}));
```

### 8.5 Audit et monitoring

- Dashboard de logs de sécurité (admin uniquement)
- Alertes sur événements suspects (5+ connexions échouées)
- Métriques de sécurité (uptime, tentatives d'attaque)

### 8.6 Chiffrement des données sensibles au repos

Pour les données très sensibles (numéros de téléphone, adresses) :
```javascript
const crypto = require('crypto');

function encryptData(data, masterKey) {
  const cipher = crypto.createCipher('aes-256-cbc', masterKey);
  return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
}
```

### 8.7 Politique de mot de passe (gestion de l'expiration)

À implémenter :
- Expiration tous les 90 jours
- Historique pour éviter la réutilisation (5 derniers)
- Notifications de changement approchant

---

## 9. Checklist de déploiement en production

- [ ] Définir `JWT_SECRET` dans `.env` (clé forte, 32+ caractères)
- [ ] Définir `FRONTEND_URL` pour la whitelist CORS
- [ ] Activer HTTPS et redirection automatique HTTP → HTTPS
- [ ] Configurer la base de données PostgreSQL avec authentification
- [ ] Configurer MongoDB avec authentification et chiffrement
- [ ] Réduire les logs de Morgan en production (ou les désactiver)
- [ ] Configurer le HSTS header
- [ ] Activer les backups réguliers des bases de données
- [ ] Monitorer les logs de sécurité pour détections d'anomalies
- [ ] Implémenter une sauvegarde des secrets (rotation régulière)

---

## 10. Références et ressources

- **OWASP Top 10** : https://owasp.org/www-project-top-ten/
- **bcryptjs** : https://www.npmjs.com/package/bcryptjs
- **jsonwebtoken** : https://www.npmjs.com/package/jsonwebtoken
- **express-rate-limit** : https://www.npmjs.com/package/express-rate-limit
- **helmet** : https://www.npmjs.com/package/helmet
- **RGPD** : https://www.cnil.fr/

---

**Document créé pour le projet TP - Concepteur Développeur d'Applications**
**Dernière mise à jour : 2024**
