# Innov'Events Mobile

Application mobile React Native pour les administrateurs et employés d'Innov'Events.

## Fonctionnalités

L'application permet de :
- Consulter la liste des événements à venir
- Voir les détails d'un événement (dates, lieu, client)
- Accéder à la fiche client avec actions rapides :
  - **Appeler** : lance l'app téléphone
  - **Email** : ouvre l'app de messagerie
  - **Itinéraire** : ouvre Google Maps / Plans
- Ajouter des notes sur les événements

## Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Pour tester sur mobile : application Expo Go (iOS/Android)

## Installation

```bash
cd apps/mobile
npm install
```

## Lancement en développement

```bash
# Démarrer le serveur Expo
npm start

# Ou directement sur un émulateur
npm run android  # Pour Android
npm run ios      # Pour iOS (Mac uniquement)
```

Scanner le QR code avec Expo Go pour tester sur votre téléphone.

## Configuration API

L'URL de l'API est configurée dans `src/config.js` :

```javascript
// En développement (émulateur Android)
export const API_URL = "http://10.0.2.2:3000";

// En développement (iOS simulateur ou web)
export const API_URL = "http://localhost:3000";

// En production
export const API_URL = "https://api.innovevents.com";
```

## Structure du projet

```
apps/mobile/
├── App.js                    # Point d'entrée
├── app.json                  # Configuration Expo
├── package.json
├── src/
│   ├── config.js             # Configuration API
│   ├── context/
│   │   └── AuthContext.js    # Gestion authentification
│   └── screens/
│       ├── LoginScreen.js    # Écran de connexion
│       ├── DashboardScreen.js # Liste des événements
│       ├── EventDetailScreen.js # Détail événement + notes
│       └── ClientDetailScreen.js # Fiche client interactive
└── assets/                   # Images et icônes
```

## Build de production

### Android (APK)

```bash
# Avec EAS Build (recommandé)
npx eas build --platform android --profile preview

# Ou en local avec Gradle
npx expo prebuild
cd android && ./gradlew assembleRelease
```

### iOS (IPA)

```bash
# Nécessite un Mac et un compte Apple Developer
npx eas build --platform ios --profile preview
```

## Docker

Pour lancer le serveur de développement dans Docker :

```bash
docker build -t innovevents-mobile .
docker run -p 19000:19000 -p 19001:19001 -p 19002:19002 innovevents-mobile
```

## Authentification

L'application est réservée aux utilisateurs avec le rôle `admin` ou `employe`.
Les tokens sont stockés de manière sécurisée avec `expo-secure-store`.

## Navigation

```
Login → Dashboard → EventDetail → ClientDetail
                 ↘ (ajout note)
```

## Liens natifs

L'application utilise les deep links natifs pour les actions :
- `tel:` pour les appels téléphoniques
- `mailto:` pour les emails
- `geo:` / `maps:` pour les itinéraires
