# Documentation - Gestion des Évènements

## Vue d'ensemble

Le module de gestion des événements permet de créer, modifier, visualiser et supprimer les événements organisés par Innov'Events. Il gère également les prestations associées à chaque événement.

## Base de données

### Tables créées

| Table | Description |
|-------|-------------|
| `events` | Événements principaux |
| `prestations` | Prestations/services liés à un événement |
| `notes` | Notes collaboratives sur les événements |
| `tasks` | Tâches à effectuer pour un événement |

### Types ENUM

**event_type** - Types d'événements :
- `seminaire`
- `conference`
- `soiree_entreprise`
- `team_building`
- `inauguration`
- `autre`

**event_status** - Statuts d'événement :
- `brouillon` - En cours de création
- `en_attente` - Devis envoyé au client
- `accepte` - Devis accepté par le client
- `en_cours` - Événement en préparation/réalisation
- `termine` - Événement passé
- `annule` - Événement annulé

**task_status** - Statuts de tâche :
- `a_faire`
- `en_cours`
- `termine`

---

## Endpoints API

### Routes publiques

#### GET `/api/events`

Liste des événements publics (visibles sur le site vitrine).

**Paramètres query :**
- `type` - Filtrer par type d'événement
- `theme` - Filtrer par thème (recherche partielle)
- `start_date` - Date de début minimum
- `end_date` - Date de fin maximum
- `limit` - Nombre de résultats (défaut: 20)
- `offset` - Pagination

**Conditions d'affichage :**
- `is_public = TRUE`
- `client_approved_public = TRUE`
- `status != 'brouillon'`

#### GET `/api/events/:id`

Détail d'un événement avec ses prestations.

- Si public : accessible à tous
- Si privé : uniquement admin, employé ou client propriétaire

#### GET `/api/events/meta/types`

Liste des types d'événements disponibles.

#### GET `/api/events/meta/statuses`

Liste des statuts disponibles.

---

### Routes protégées (admin/employé)

#### GET `/api/events/admin`

Liste complète des événements (tous statuts).

**Headers requis :** `Authorization: Bearer <token>`
**Rôles :** admin, employe

**Paramètres query :**
- `status` - Filtrer par statut
- `client_id` - Filtrer par client
- `limit`, `offset` - Pagination

---

### Routes admin uniquement

#### POST `/api/events`

Créer un nouvel événement.

**Headers requis :** `Authorization: Bearer <token>`
**Rôle :** admin

**Body :**
```json
{
  "name": "Séminaire Innovation 2024",
  "description": "Séminaire annuel...",
  "event_type": "seminaire",
  "theme": "Innovation digitale",
  "start_date": "2024-06-15T09:00:00",
  "end_date": "2024-06-15T18:00:00",
  "location": "Paris - La Défense",
  "participants_count": 150,
  "image_url": "https://...",
  "status": "brouillon",
  "is_public": false,
  "client_id": 1
}
```

#### PUT `/api/events/:id`

Modifier un événement existant.

#### DELETE `/api/events/:id`

Supprimer un événement (et ses prestations en cascade).

---

### Prestations

#### POST `/api/events/:id/prestations`

Ajouter une prestation à un événement.

**Body :**
```json
{
  "label": "Location de salle",
  "amount_ht": 5000.00,
  "tva_rate": 20.00
}
```

#### DELETE `/api/events/:eventId/prestations/:prestationId`

Supprimer une prestation.

---

## Frontend

### Page publique `/evenements`

- Affiche les événements publics validés
- Filtres par type, thème et plage de dates
- Cards avec image, type, dates et lieu
- Modal de détail avec lien vers demande de devis

### Page admin `/admin/evenements`

- Liste complète avec tous les statuts
- Filtrage par statut
- Création/modification via modal
- Affectation à un client
- Gestion de la visibilité publique

---

## Journalisation

Les actions suivantes sont loguées dans MongoDB :

| Action | type_action |
|--------|-------------|
| Création d'événement | `CREATION_EVENEMENT` |
| Modification de statut | `MODIFICATION_STATUT_EVENEMENT` |
| Suppression | `SUPPRESSION_EVENEMENT` |

---

## Script SQL

Pour créer les tables, exécuter :

```bash
docker exec -i innovevents-manager-db-1 psql -U postgres -d innovevents < docs/database/004_events.sql
```
