# Application Mobile Innov'Events

Application mobile développée en React Native avec Expo, destinée aux administrateurs et employés pour consulter les événements et contacter les clients en déplacement.

## Objectif

Permettre à Chloé et José d'accéder rapidement aux informations clients et événements depuis leur téléphone. L'app se concentre sur l'essentiel : consulter, appeler, envoyer un mail, trouver un itinéraire.

## Stack technique

- **Framework** : React Native 0.74
- **Plateforme** : Expo SDK 51
- **Navigation** : React Navigation 6
- **Stockage sécurisé** : expo-secure-store (pour les tokens JWT)
- **Liens natifs** : expo-linking (tel, mailto, geo)

## Structure du projet

```
apps/mobile/
├── App.js                 # Point d'entrée, gestion navigation
├── app.json               # Configuration Expo (nom, icônes, splash)
├── package.json           # Dépendances
├── babel.config.js
├── Dockerfile             # Pour lancer le dev server en container
├── README.md
├── assets/                # Icônes et splash screen
└── src/
    ├── config.js          # URL de l'API
    ├── context/
    │   └── AuthContext.js # Authentification + stockage token
    └── screens/
        ├── LoginScreen.js
        ├── DashboardScreen.js
        ├── EventDetailScreen.js
        └── ClientDetailScreen.js
```

## Écrans

### 1. LoginScreen

Écran de connexion réservé aux admins et employés.

**Champs :**
- Email
- Mot de passe

**Comportement :**
- Vérifie que le rôle est `admin` ou `employe`
- Stocke le token JWT de manière sécurisée avec `SecureStore`
- Refuse l'accès aux clients (rôle `client`)

### 2. DashboardScreen

Liste des événements à venir avec statistiques rapides.

**Éléments affichés :**
- Header avec nom de l'utilisateur connecté
- 2 cartes stats : total événements / événements cette semaine
- Liste scrollable des événements triés par date

**Pour chaque événement :**
- Nom de l'événement
- Nom du client
- Date de début
- Lieu
- Badge de statut (couleur selon état)
- Indicateur "urgent" si l'événement est dans moins de 7 jours

**Actions :**
- Pull-to-refresh pour actualiser
- Clic sur un événement → EventDetailScreen
- Bouton déconnexion

### 3. EventDetailScreen

Fiche détaillée d'un événement avec gestion des notes.

**Informations affichées :**
- Nom de l'événement
- Statut (badge coloré)
- Date et heure de début
- Date et heure de fin
- Lieu
- Type d'événement
- Description

**Section Client :**
- Carte cliquable avec nom de l'entreprise et contact
- Clic → ClientDetailScreen

**Section Notes :**
- Liste des notes existantes (auteur + date)
- Bouton "Ajouter" qui ouvre une modal
- Champ texte multilignes pour saisir la note
- Enregistrement via l'API

### 4. ClientDetailScreen

Fiche client avec actions de contact rapides.

**Header :**
- Avatar avec initiale de l'entreprise
- Nom de l'entreprise
- Nom du contact principal

**Boutons d'action (en un clic) :**

| Action | Icône | Lien natif | Comportement |
|--------|-------|------------|--------------|
| Appeler | 📞 | `tel:0612345678` | Ouvre l'app Téléphone |
| Email | ✉️ | `mailto:client@example.com` | Ouvre l'app Mail |
| Itinéraire | 🗺️ | `geo:` ou `maps:` | Ouvre Google Maps / Plans |

**Informations détaillées :**
- Téléphone (cliquable)
- Email (cliquable)
- Adresse complète (cliquable → itinéraire)
- SIRET
- Date de création du client
- Notes éventuelles

## Configuration API

Le fichier `src/config.js` définit l'URL de l'API :

```javascript
// Émulateur Android : 10.0.2.2 pointe vers localhost de la machine hôte
export const API_URL = __DEV__
  ? "http://10.0.2.2:3000"
  : "https://api.innovevents.com";
```

Pour iOS Simulator ou le web, utiliser `localhost` directement.

## Authentification

Le flux d'authentification :

1. L'utilisateur entre ses identifiants
2. Appel `POST /api/auth/login`
3. Vérification du rôle (admin ou employe uniquement)
4. Token JWT stocké dans `SecureStore` (chiffré sur l'appareil)
5. Au prochain lancement, le token est chargé automatiquement
6. Appel `GET /api/auth/me` pour vérifier la validité

La déconnexion supprime le token du `SecureStore`.

## Endpoints API utilisés

| Méthode | Endpoint | Usage |
|---------|----------|-------|
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Vérification token |
| GET | `/api/events?upcoming=true` | Liste événements à venir |
| GET | `/api/events/:id/notes` | Notes d'un événement |
| POST | `/api/events/:id/notes` | Ajouter une note |
| GET | `/api/clients/:id` | Détail client |

## Liens natifs (Deep Links)

L'app utilise `Linking` d'Expo pour ouvrir les applications natives :

```javascript
// Appel téléphonique
Linking.openURL(`tel:${phoneNumber}`);

// Email
Linking.openURL(`mailto:${email}`);

// Itinéraire (différent selon OS)
Platform.select({
  ios: `maps:0,0?q=${address}`,
  android: `geo:0,0?q=${address}`,
});
```

Si l'app native échoue, fallback vers Google Maps web.

## Installation et lancement

### Prérequis

- Node.js 18+
- npm
- Application Expo Go sur le téléphone (pour tester)

### En local

```bash
cd apps/mobile
npm install
npx expo start
```

Scanner le QR code affiché avec Expo Go.

### Avec Docker

```bash
# Depuis la racine du projet
docker-compose up mobile

# Ou juste l'app mobile
cd apps/mobile
docker build -t innovevents-mobile .
docker run -p 19000:19000 -p 19001:19001 -p 19002:19002 innovevents-mobile
```

## Build de production

### Android (APK / AAB)

```bash
# Avec EAS Build (service Expo)
npx eas build --platform android --profile production

# En local (nécessite Android Studio)
npx expo prebuild
cd android
./gradlew assembleRelease
```

L'APK généré se trouve dans `android/app/build/outputs/apk/release/`.

### iOS (IPA)

```bash
# Nécessite un Mac + compte Apple Developer
npx eas build --platform ios --profile production
```

## Captures d'écran (wireframes)

### Login
```
┌─────────────────────────┐
│                         │
│     Innov'Events        │
│   Application Mobile    │
│                         │
│  ┌───────────────────┐  │
│  │ Email             │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ Mot de passe      │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │   Se connecter    │  │
│  └───────────────────┘  │
│                         │
│  Accès réservé admins   │
└─────────────────────────┘
```

### Dashboard
```
┌─────────────────────────┐
│ Bonjour,        [Déco]  │
│ Chloé                   │
├─────────────────────────┤
│ ┌─────────┐ ┌─────────┐ │
│ │    12   │ │    3    │ │
│ │ Events  │ │Semaine  │ │
│ └─────────┘ └─────────┘ │
├─────────────────────────┤
│ Événements à venir      │
│ ┌─────────────────────┐ │
│ │ Séminaire TechCorp  │ │
│ │ TechCorp Inc    [●] │ │
│ │ 📅 15 fév  📍 Paris │ │
│ │ ⚠️ Dans 3 jours     │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Conférence Bio      │ │
│ │ GreenLife      [●]  │ │
│ │ 📅 22 fév  📍 Lyon  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Fiche Événement
```
┌─────────────────────────┐
│ ← Séminaire TechCorp    │
│   [en_cours]            │
├─────────────────────────┤
│ Détails                 │
│ 📅 15 fév 2026 à 09:00  │
│ 📅 15 fév 2026 à 18:00  │
│ 📍 Paris La Défense     │
│ 🏷️ Séminaire            │
├─────────────────────────┤
│ Client                  │
│ ┌─────────────────────┐ │
│ │ TechCorp Inc      → │ │
│ │ Jean Dupont         │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Notes          [+Ajouter]│
│ ┌─────────────────────┐ │
│ │ Prévoir micro HF    │ │
│ │ Chloé - 10/02/2026  │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Fiche Client
```
┌─────────────────────────┐
│        ┌───┐            │
│        │ T │            │
│        └───┘            │
│     TechCorp Inc        │
│     Jean Dupont         │
├─────────────────────────┤
│  📞        ✉️        🗺️  │
│ Appeler  Email   Itin.  │
├─────────────────────────┤
│ Coordonnées             │
│ 📱 06 12 34 56 78       │
│ ✉️ contact@techcorp.fr  │
│ 📍 15 rue de la Paix    │
│    75001 Paris          │
├─────────────────────────┤
│ Informations            │
│ 🏢 SIRET: 123 456 789   │
│ 📅 Client depuis: 2024  │
└─────────────────────────┘
```

## Sécurité

- Tokens JWT stockés avec `expo-secure-store` (chiffrement natif)
- Pas de stockage de mot de passe côté client
- Vérification du rôle à la connexion
- Expiration automatique du token gérée par l'API
