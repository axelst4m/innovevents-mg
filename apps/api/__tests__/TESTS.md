# Documentation des Tests API - Innov'Events

## Vue d'ensemble

Cette documentation décrit les tests automatisés de l'API Innov'Events. Les tests sont écrits avec **Jest** et **Supertest**.

**Dernière mise à jour :** 26 janvier 2026
**Total des tests :** 45
**Taux de réussite :** 100%

## Exécution des tests

```bash
# Lancer tous les tests
npm test

# Lancer avec détection des handles ouverts (debug)
npm test -- --detectOpenHandles

# Lancer un fichier spécifique
npm test -- auth.test.js
npm test -- users.test.js
```

## Configuration

Les tests utilisent un fichier `.env.test` avec les variables d'environnement de test :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/innovevents_test
JWT_SECRET=test_secret_key
NODE_ENV=test
```

## Structure des fichiers

```
__tests__/
├── helpers.js       # Fonctions utilitaires (createTestUser, cleanupTestUsers, etc.)
├── auth.test.js     # Tests d'authentification (19 tests)
├── users.test.js    # Tests gestion utilisateurs admin (26 tests)
└── TESTS.md         # Cette documentation
```

---

## Tests d'Authentification (`auth.test.js`)

### POST /api/auth/register - Inscription

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Création compte valide | Crée un compte avec email, password, firstname, lastname | `201` |
| Email déjà utilisé | Refuse si l'email existe déjà | `409` |
| Email invalide | Refuse un format d'email incorrect | `400` |
| Mot de passe trop court | Refuse si < 8 caractères | `400` |
| Mot de passe sans majuscule | Refuse si pas de majuscule | `400` |
| Mot de passe sans caractère spécial | Refuse si pas de caractère spécial | `400` |
| Champs manquants | Refuse si des champs obligatoires manquent | `400` |

**Règles de validation du mot de passe :**
- Minimum 8 caractères
- Au moins 1 majuscule
- Au moins 1 minuscule
- Au moins 1 chiffre
- Au moins 1 caractère spécial (!@#$%^&*(),.?":{}|<>)

### POST /api/auth/login - Connexion

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Connexion valide | Connecte avec email/password corrects, retourne un token JWT | `200` |
| Mot de passe incorrect | Refuse si le mot de passe est faux | `401` |
| Email inconnu | Refuse si l'email n'existe pas | `401` |
| Champs manquants | Refuse si email ou password manquant | `400` |

### GET /api/auth/me - Profil utilisateur

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Profil avec token valide | Retourne les infos de l'utilisateur connecté | `200` |
| Sans token | Refuse l'accès | `401` |
| Token invalide | Refuse l'accès | `401` |

### POST /api/auth/change-password - Changement de mot de passe

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Changement valide | Change le mot de passe avec l'ancien correct | `200` |
| Ancien mot de passe incorrect | Refuse si l'ancien mot de passe est faux | `401` |
| Nouveau mot de passe invalide | Refuse si le nouveau ne respecte pas les règles | `400` |

### POST /api/auth/forgot-password - Mot de passe oublié

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Email existant ou non | Retourne toujours OK (anti-énumération) | `200` |
| Email manquant | Refuse si email non fourni | `400` |

**Note importante :** Ce endpoint utilise un utilisateur de test (`test_forgot@test.com`) et non le compte admin réel pour éviter de modifier les données de production pendant les tests.

---

## Tests Gestion Utilisateurs Admin (`users.test.js`)

Ces tests vérifient les fonctionnalités CRUD des utilisateurs, accessibles uniquement aux administrateurs.

### Utilisateurs de test créés

```javascript
adminUser   // role: admin, email: test_admin@test.com
employeUser // role: employe, email: test_employe@test.com
clientUser  // role: client, email: test_client@test.com
```

### GET /api/users - Liste des utilisateurs

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Liste pour admin | Retourne la liste des utilisateurs | `200` |
| Filtre par rôle | Filtre les utilisateurs par rôle (admin/employe/client) | `200` |
| Filtre par statut | Filtre par statut (active/inactive) | `200` |
| Accès refusé employé | Un employé ne peut pas accéder | `403` |
| Accès refusé client | Un client ne peut pas accéder | `403` |
| Sans token | Refuse l'accès | `401` |

### GET /api/users/stats/count - Statistiques

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Stats pour admin | Retourne le nombre d'utilisateurs par rôle/statut | `200` |

**Réponse attendue :**
```json
{
  "stats": {
    "total": 10,
    "admins": 2,
    "employes": 3,
    "clients": 5,
    "actifs": 8,
    "inactifs": 2
  }
}
```

### POST /api/users - Création d'utilisateur

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Création valide | Crée un utilisateur avec mot de passe temporaire | `201` |
| Email déjà utilisé | Refuse si l'email existe | `409` |
| Rôle invalide | Refuse un rôle non reconnu | `400` |
| Champs manquants | Refuse si email/firstname/lastname/role manquent | `400` |
| Accès refusé non-admin | Un non-admin ne peut pas créer | `403` |

**Réponse succès :**
```json
{
  "message": "Utilisateur cree avec succes",
  "user": { "id": 1, "email": "...", "role": "employe" },
  "tempPassword": "AB1234cd!"
}
```

### PUT /api/users/:id - Modification d'utilisateur

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Modification valide | Modifie firstname/lastname | `200` |
| Changement de rôle | Change le rôle d'un utilisateur | `200` |
| Modifier son propre rôle | Un admin ne peut pas modifier son propre rôle | `403` |
| Utilisateur inexistant | Retourne 404 si l'ID n'existe pas | `404` |

### PATCH /api/users/:id/toggle-status - Activation/Désactivation

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Désactiver un utilisateur | Passe is_active à false | `200` |
| Réactiver un utilisateur | Passe is_active à true | `200` |
| Se désactiver soi-même | Un admin ne peut pas se désactiver | `403` |
| Connexion bloquée si désactivé | Un utilisateur désactivé ne peut pas se connecter | `403` |
| Connexion après réactivation | Un utilisateur réactivé peut se reconnecter | `200` |
| Scénario client lié | Test complet : client + inscription + désactivation + réactivation | `200` |

**Scénario client lié (test de non-régression) :**
1. Création d'un client (simulation conversion prospect)
2. Inscription du client (liaison automatique user_id)
3. Désactivation du compte par admin
4. Vérification que la connexion est bloquée (403)
5. Réactivation du compte par admin
6. Vérification que la connexion fonctionne à nouveau (200)

### POST /api/users/:id/reset-password - Réinitialisation mot de passe

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Reset valide | Génère un nouveau mot de passe temporaire | `200` |
| Utilisateur inexistant | Retourne 404 si l'ID n'existe pas | `404` |

**Réponse succès :**
```json
{
  "message": "Mot de passe reinitialise",
  "tempPassword": "XY9876ab@"
}
```

### GET /api/users/:id - Détail d'un utilisateur

| Test | Description | Statut attendu |
|------|-------------|----------------|
| Détail valide | Retourne les infos complètes de l'utilisateur | `200` |
| Utilisateur inexistant | Retourne 404 si l'ID n'existe pas | `404` |

---

## Helpers de test (`helpers.js`)

### Fonctions disponibles

```javascript
// Génère un token JWT pour les tests
generateToken(user)

// Crée un utilisateur de test dans la base
createTestUser({
  email: "test@test.com",
  password: "Test123!",
  firstname: "Test",
  lastname: "User",
  role: "client"  // admin, employe, client
})

// Supprime un utilisateur par ID
deleteTestUser(userId)

// Supprime tous les utilisateurs de test (email LIKE 'test_%@test.com')
cleanupTestUsers()
```

### Bonnes pratiques

1. **Toujours nettoyer** les données de test avec `cleanupTestUsers()` dans `beforeAll` et `afterAll`
2. **Utiliser des emails uniques** avec timestamp pour éviter les conflits : `test_${Date.now()}@test.com`
3. **Ne jamais utiliser** les vrais comptes (admin@ino.fr) dans les tests
4. **Isoler les tests** : chaque test doit être indépendant des autres

---

## Journalisation MongoDB

Les actions utilisateurs sont loguées dans MongoDB (collection `logs`). Types d'actions testés :

| Type d'action | Déclenché par |
|---------------|---------------|
| `CREATION_COMPTE` | POST /api/auth/register |
| `CONNEXION_REUSSIE` | POST /api/auth/login (succès) |
| `CONNEXION_ECHOUEE` | POST /api/auth/login (échec) |
| `CREATION_UTILISATEUR_ADMIN` | POST /api/users |
| `MODIFICATION_UTILISATEUR` | PUT /api/users/:id |
| `DESACTIVATION_COMPTE` | PATCH /api/users/:id/toggle-status (désactivation) |
| `REACTIVATION_COMPTE` | PATCH /api/users/:id/toggle-status (réactivation) |
| `RESET_PASSWORD_ADMIN` | POST /api/users/:id/reset-password |
| `MOT_DE_PASSE_REINITIALISE` | POST /api/auth/forgot-password |
| `CHANGEMENT_MOT_DE_PASSE` | POST /api/auth/change-password |

**Consultation des logs :**
```bash
docker exec -it $(docker ps -qf "name=mongo") mongosh innovevents --eval "db.logs.find().sort({horodatage: -1}).limit(20)"
```

---

## Problèmes connus et solutions

### Jest ne se ferme pas après les tests

**Symptôme :** Message "Jest did not exit one second after the test run has completed"

**Cause :** Connexions PostgreSQL/MongoDB non fermées

**Solution temporaire :** Les tests passent quand même, Jest finit par timeout

### Mot de passe admin modifié par les tests

**Symptôme :** Impossible de se connecter avec le compte admin après les tests

**Cause :** Un test utilisait le vrai compte admin pour tester forgot-password

**Solution :** Le test a été corrigé pour utiliser un utilisateur de test (`test_forgot@test.com`)
