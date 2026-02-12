#!/bin/bash
# ==============================================
# Script de deploiement manuel - Innov'Events
# ==============================================
# Usage : ./scripts/deploy.sh
#
# Ce script est un fallback si le CI/CD ne fonctionne pas.
# A executer directement sur le VPS.

set -e

echo "=========================================="
echo "  Deploiement Innov'Events"
echo "=========================================="

# Verifier qu'on est dans le bon repertoire
if [ ! -f "docker-compose.prod.yml" ]; then
  echo "Erreur : docker-compose.prod.yml introuvable."
  echo "Lancer ce script depuis la racine du projet."
  exit 1
fi

# Verifier le fichier .env
if [ ! -f ".env" ]; then
  echo "Erreur : fichier .env introuvable."
  echo "Copier .env.production.example en .env et remplir les valeurs."
  exit 1
fi

echo ""
echo "1/5 - Pull des derniers changements..."
git pull origin main

echo ""
echo "2/5 - Build des images Docker..."
docker compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "3/5 - Redemarrage des containers..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "4/5 - Nettoyage des anciennes images..."
docker image prune -f

echo ""
echo "5/5 - Verification du healthcheck..."
sleep 10

if curl -sf http://localhost/health > /dev/null 2>&1; then
  echo "Healthcheck OK"
else
  echo "Healthcheck echoue - verification des logs..."
  docker compose -f docker-compose.prod.yml logs --tail=20 api
fi

echo ""
echo "=========================================="
echo "  Deploiement termine"
echo "=========================================="
docker compose -f docker-compose.prod.yml ps
