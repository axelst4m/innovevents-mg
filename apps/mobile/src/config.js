// Configuration de l'API
// En dev local sur emulateur Android: 10.0.2.2 au lieu de localhost
// En dev local sur iOS simulateur: localhost fonctionne
// En prod: mettre l'URL de l'API deployee

export const API_URL = __DEV__
  ? "http://10.0.2.2:3000" // Pour emulateur Android
  : "https://api.innovevents.com"; // URL de prod

// Alternative pour iOS ou web
// export const API_URL = "http://localhost:3000";
