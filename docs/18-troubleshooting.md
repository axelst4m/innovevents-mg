# Troubleshooting - Problemes rencontres et solutions

Ce document recense les problemes techniques rencontres lors du developpement et du deploiement du projet Innov'Events, ainsi que les solutions appliquees. Il illustre la demarche de resolution de problemes (competence AT3).

## 1. Deploiement - Configuration Traefik

### Probleme : certificat SSL non genere

**Symptome** : le site retourne une erreur 504 Gateway Timeout apres deploiement.

**Cause** : le nom du cert resolver dans les labels Docker etait `letsencrypt` alors que la configuration Traefik sur le VPS utilise `le`.

**Solution** : aligner le nom du resolver dans `docker-compose.prod.yml` :

```yaml
# Avant (incorrect)
- "traefik.http.routers.innovevents.tls.certresolver=letsencrypt"

# Apres (correct)
- "traefik.http.routers.innovevents.tls.certresolver=le"
```

### Probleme : conflit de middleware entre projets

**Symptome** : erreur Traefik, le middleware `redirect-to-https` est defini par deux projets differents.

**Cause** : les noms de middlewares Traefik sont globaux. Deux projets sur le meme VPS utilisaient le meme nom.

**Solution** : prefixer les noms de middlewares avec le nom du projet :

```yaml
- "traefik.http.routers.innovevents-http.middlewares=innovevents-redirect-https"
- "traefik.http.middlewares.innovevents-redirect-https.redirectscheme.scheme=https"
```

### Probleme : interpolation Docker Compose casse la syntaxe Host

**Symptome** : Traefik ne route pas le trafic, la regle `Host()` est malformee.

**Cause** : l'utilisation de `${DEPLOY_HOST}` dans les labels Docker Compose provoquait une mauvaise interpolation des backticks et parentheses.

**Solution** : hardcoder le domaine directement dans le label :

```yaml
# Avant (casse par l'interpolation)
- "traefik.http.routers.innovevents.rule=Host(`${DEPLOY_HOST}`)"

# Apres (fonctionne)
- "traefik.http.routers.innovevents.rule=Host(`inno.st4m.fr`)"
```

### Probleme : Gateway timeout apres redemarrage des containers

**Symptome** : apres `docker compose down` puis `up`, le site retourne 504.

**Cause** : Traefik ne detecte pas automatiquement les nouveaux containers apres destruction et recreation.

**Solution** : redemarrer Traefik apres un cycle down/up :

```bash
docker restart traefik
```

## 2. Base de donnees PostgreSQL

### Probleme : type NUMERIC retourne des strings en Node.js

**Symptome** : les tests unitaires echouent avec `Expected: 150, Received: "150.00"`.

**Cause** : le driver `node-pg` retourne les colonnes PostgreSQL de type `NUMERIC` sous forme de strings pour eviter la perte de precision.

**Solution** : wrapper les assertions avec `Number()` dans les tests :

```javascript
// Avant (echoue)
expect(ligne.unit_price_ht).toBe(150);

// Apres (fonctionne)
expect(Number(ligne.unit_price_ht)).toBe(150);
```

### Probleme : colonne ambigue dans un JOIN

**Symptome** : erreur 500 sur la route GET /api/reviews avec le message `column reference "status" is ambiguous`.

**Cause** : la colonne `status` existe dans les tables `reviews` ET `events`, et le JOIN ne precise pas le prefixe.

**Solution** : prefixer toutes les colonnes avec l'alias de table :

```sql
-- Avant (ambigue)
WHERE status = 'valide'

-- Apres (explicite)
WHERE r.status = 'valide'
```

### Probleme : seed SQL echoue avec violation de foreign key

**Symptome** : `INSERT INTO clients ... violates foreign key constraint "clients_user_id_fkey"`. Le seed reference `user_id = 4` mais cet ID n'existe pas.

**Cause** : `TRUNCATE TABLE users CASCADE` vide la table mais ne remet pas la sequence d'auto-increment a 1. Les nouveaux users sont inseres avec des IDs incrementes (7, 8, 9...) au lieu de 1, 2, 3.

**Solution** : ajouter `RESTART IDENTITY` au TRUNCATE :

```sql
-- Avant (sequence non resetee)
TRUNCATE TABLE users CASCADE;

-- Apres (sequence remise a 1)
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
```

### Probleme : hash bcrypt invalide dans le seed

**Symptome** : login 401 avec les comptes de demonstration malgre le bon mot de passe.

**Cause** : le hash bcrypt utilise dans le seed etait un hash d'exemple copie d'internet, qui ne correspondait a aucun mot de passe reel.

**Solution** : generer un vrai hash bcrypt pour le mot de passe souhaite :

```javascript
const bcrypt = require('bcryptjs');
bcrypt.hash('Password123!', 10).then(h => console.log(h));
// $2a$10$ZNanCe0rXitEhFh65G7hyeLtTHPPoJsl201/HwqwIEsGpOUKdN.4i
```

### Probleme : statuts avis incoherents entre seed et API

**Symptome** : les avis valides ne s'affichent pas sur la page publique.

**Cause** : le seed inserait `'validee'` et `'refusee'` alors que l'API filtre sur `'valide'` et `'refuse'` (valeurs definies dans le schema SQL).

**Solution** : aligner les valeurs du seed avec le schema :

```sql
-- Avant (incoherent avec le schema)
'validee', 'refusee'

-- Apres (conforme au schema)
'valide', 'refuse'
```

## 3. Docker et conteneurisation

### Probleme : module npm absent dans le container

**Symptome** : l'API crash avec `MODULE_NOT_FOUND: express-rate-limit`.

**Cause** : un volume anonyme Docker cachait l'ancien `node_modules` qui ne contenait pas la nouvelle dependance. Meme apres un rebuild, le volume anonyme prend precedence.

**Solution** : supprimer les volumes anonymes et rebuilder sans cache :

```bash
docker compose down -v
docker compose build --no-cache api
docker compose up -d
```

## 4. CI/CD GitHub Actions

### Probleme : deploiement inutile sur modification de documentation

**Symptome** : un push sur `main` contenant uniquement des modifications de documentation (docs/, README, .gitignore) declenche le workflow CD et redeploy les containers.

**Cause** : le workflow `deploy.yml` se declenchait sur tout push vers `main`, sans filtrer les chemins modifies.

**Solution** : ajouter un filtre `paths` pour ne deployer que si du code applicatif change :

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'apps/**'
      - 'docker-compose.prod.yml'
      - '.github/workflows/**'
```

### Probleme : le workflow CD ne se declenche pas

**Symptome** : seul le workflow CI apparait dans l'onglet Actions, le CD n'apparait jamais.

**Cause** : `deploy.yml` appelle `ci.yml` via `uses: ./.github/workflows/ci.yml`, mais `ci.yml` n'avait pas le trigger `workflow_call` necessaire pour etre utilise comme workflow reutilisable.

**Solution** : ajouter `workflow_call:` dans les triggers de `ci.yml` :

```yaml
on:
  push:
    branches: [dev, main]
  pull_request:
    branches: [dev, main]
  workflow_call:   # Permet a deploy.yml de l'appeler
```

### Probleme : healthcheck CD echoue

**Symptome** : le step "Verify deployment" echoue avec "Healthcheck echoue".

**Cause** : le healthcheck essayait de curl l'IP du VPS depuis le runner GitHub. Mais Traefik ne repond qu'au domaine configure, pas a l'IP brute.

**Solution** : faire le healthcheck via SSH directement sur le VPS avec le vrai domaine :

```yaml
# Verification directe sur le VPS via le domaine HTTPS
curl -sf https://inno.st4m.fr/health || echo "Healthcheck failed (non bloquant)"
```

## 5. Tests unitaires

### Probleme : Jest ne termine pas (processus bloque)

**Symptome** : les tests passent mais Jest reste bloque indefiniment avec le message "Jest did not exit one second after the test run has completed".

**Cause** : la connexion MongoDB ouverte pendant les tests n'etait jamais fermee, empechant Node.js de terminer le processus.

**Solution** : ajouter une fonction de fermeture dans `mongo.js` et l'appeler dans le teardown :

```javascript
// apps/api/src/db/mongo.js
async function closeMongoClient() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
module.exports = { getMongoDb, closeMongoClient };

// apps/api/__tests__/setup.js
const { closeMongoClient } = require("../src/db/mongo");
afterAll(async () => {
  await closeMongoClient();
  await pool.end();
});
```

### Probleme : valeur d'enum inexistante dans les tests

**Symptome** : test echoue avec une erreur PostgreSQL sur la valeur d'enum.

**Cause** : le test utilisait le statut `'confirme'` qui n'existe pas dans l'enum `event_status`. Les valeurs valides sont : `brouillon`, `en_attente`, `accepte`, `en_cours`, `termine`, `annule`.

**Solution** : utiliser une valeur d'enum existante (`'accepte'`).

## 6. Generation PDF

### Probleme : montants > 999 EUR mal affiches

**Symptome** : les montants s'affichaient mal dans les PDF generes. Par exemple "1 200 EUR" devenait "1/200 EUR".

**Cause** : `toLocaleString("fr-FR")` utilise des espaces insecables (caractere Unicode U+202F) comme separateur de milliers. PDFKit interpretait mal ce caractere.

**Solution** : reecrire la fonction `formatMoney()` avec un formatage manuel qui utilise des espaces classiques.

## 7. Donnees de test

### Probleme : tests qui reinitialisent le compte admin

**Symptome** : apres chaque lancement des tests, le mot de passe du compte admin etait reinitialise et ne correspondait plus au mot de passe attendu.

**Cause** : un test pour la fonctionnalite "mot de passe oublie" utilisait le vrai compte admin au lieu d'un utilisateur de test dedie.

**Solution** : toujours utiliser des comptes de test dedies, jamais les comptes reels de l'application.
