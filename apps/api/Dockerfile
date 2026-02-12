# ---- Stage DEV ----
FROM node:20-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

EXPOSE 3000
CMD ["npm","run","dev"]

# ---- Stage PROD ----
FROM node:20-alpine AS prod
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
