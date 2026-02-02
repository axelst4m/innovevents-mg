# Conversion Prospect → Client

Ce document explique le processus de conversion d'un prospect en client dans l'application.

## Contexte

Quand un prospect est intéressant (demande sérieuse, budget cohérent) l'admin peut le convertir en client. Cette action crée automatiquement :
- Une fiche client dans la table `clients`
- Un devis brouillon pré-rempli avec les infos de la demande

## Déclenchement

L'admin clique sur "Convertir en client" depuis la modal de détail d'un prospect dans `/admin/prospects`.

Le bouton est désactivé si le prospect a déjà été converti (il a un `client_id`).

## Endpoint API

```
POST /api/prospects/:id/convert
```

Pas de body requis. Toutes les infos sont récupérées depuis le prospect.

### Réponse succès (201)

```json
{
  "ok": true,
  "client": {
    "id": 12,
    "company_name": "Ma Boîte",
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean@maboite.fr",
    "created_at": "2026-01-26T10:30:00Z"
  },
  "devis": {
    "id": 5,
    "reference": "DEV-2026-0005"
  }
}
```

### Erreurs possibles

| Code | Cas |
|------|-----|
| 400 | ID invalide |
| 404 | Prospect non trouvé |
| 409 | Prospect déjà converti (a un client_id) |
| 409 | Email déjà utilisé par un autre client |

## Logique métier

### 1. Vérifications

On charge le prospect et on vérifie :
- Qu'il existe
- Qu'il n'est pas déjà converti (`client_id` doit être null)

### 2. Création du client

On insère dans la table `clients` avec les infos du prospect :
- company_name
- firstname / lastname
- email
- phone
- location

### 3. Création du devis brouillon

Un devis est créé automatiquement avec :
- `status = 'brouillon'`
- `client_id` du nouveau client
- `valid_until` = date du jour + 30 jours
- `custom_message` pré-rempli avec les infos de la demande initiale :
  - Type d'événement
  - Date souhaitée
  - Nombre de participants
  - Message du prospect

Ca fait gagner du temps à l'admin qui n'a plus qu'à ajouter les lignes de prestation.

### 4. Mise à jour du prospect

On met à jour le prospect :
- `client_id` = id du nouveau client
- `status` = 'qualifie'
- `converted_at` = maintenant

### 5. Journalisation

Une entrée est créée dans MongoDB :

```json
{
  "type_action": "CREATION_CLIENT",
  "id_utilisateur": null,
  "details": {
    "client_id": 12,
    "client_name": "Jean Dupont",
    "devis_id": 5,
    "devis_reference": "DEV-2026-0005"
  }
}
```

## Code source

Le code est dans `apps/api/src/routes/prospects.js`, route `POST /prospects/:id/convert`.

Points importants :
- Pas de transaction SQL explicite (on pourrait en ajouter pour plus de robustesse)
- L'erreur de doublon email est catchée via le message PostgreSQL "duplicate key value"
- La journalisation MongoDB est non bloquante (try/catch silencieux)

## Côté frontend

Après la conversion le frontend :
1. Affiche un message de succès
2. Redirige vers la page du devis pour le compléter

Le composant concerné est `AdminProspects.jsx`, fonction `convertToClient()`.

## Flux complet

```
Prospect (a_contacter)
       │
       │ Admin clique "Convertir"
       ▼
   API vérifie
       │
       ├── Client créé (table clients)
       │
       ├── Devis brouillon créé (table devis)
       │
       ├── Prospect mis à jour (client_id, status='qualifie')
       │
       └── Log MongoDB
       │
       ▼
Redirect vers /admin/devis?view=X
```

## Lien avec l'inscription client

Si le client s'inscrit plus tard avec le même email, son compte user sera automatiquement lié à sa fiche client. C'est géré dans la route `/api/auth/register` qui cherche un client avec le même email et met à jour `clients.user_id`.
