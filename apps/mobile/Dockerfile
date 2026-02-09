# Dockerfile pour le serveur de développement Expo
# Note: Ce Dockerfile est principalement utilisé pour le développement
# En production, l'app sera compilée en binaire natif (APK/IPA)

FROM node:20-alpine

# Installer les dépendances système
RUN apk add --no-cache git

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Exposer le port Expo
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Variables d'environnement Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Démarrer Expo
CMD ["npx", "expo", "start", "--tunnel"]
