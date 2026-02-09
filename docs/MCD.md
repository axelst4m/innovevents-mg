# Modèle Conceptuel de Données (MCD)

Ce document décrit la structure de la base de données PostgreSQL du projet Innov'Events.

## Vue d'ensemble

La base contient 13 tables réparties en plusieurs domaines :
- Gestion commerciale (prospects, clients, devis)
- Gestion des événements (events, prestations, notes, tasks)
- Authentification (users)
- Communication (contact_messages, reviews)

## Schéma relationnel

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  prospects  │────────>│   clients   │<────────│    users    │
│             │  1:0,1  │             │   0,1:1 │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │                       │
                              │ 1:N                   │ 1:N
                              ▼                       │
┌─────────────┐         ┌─────────────┐              │
│    devis    │<────────│   events    │<─────────────┘
│             │   0,1:N │             │   (created_by)
└─────────────┘         └─────────────┘
      │                       │
      │ 1:N                   │ 1:N
      ▼                       ▼
┌─────────────┐         ┌─────────────┐
│lignes_devis │         │ prestations │
└─────────────┘         │    notes    │
                        │    tasks    │
                        └─────────────┘
```

## Tables principales

### prospects

Les demandes de devis qui arrivent depuis le formulaire public. Quand un prospect est converti en client on garde la trace avec `client_id`.

| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGSERIAL | PK |
| company_name | VARCHAR(255) | Nom de la boîte |
| firstname | VARCHAR(100) | Prénom |
| lastname | VARCHAR(100) | Nom |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(50) | Téléphone |
| location | VARCHAR(255) | Lieu souhaité pour l'event |
| event_type | VARCHAR(100) | Type d'événement demandé |
| event_date | DATE | Date souhaitée |
| participants | INTEGER | Nombre de personnes |
| message | TEXT | Le message de la demande |
| status | VARCHAR(50) | a_contacter, contacte, qualifie, refuse |
| client_id | INTEGER | FK → clients (si converti) |
| converted_at | TIMESTAMPTZ | Date de conversion |
| created_at | TIMESTAMPTZ | Date de création |

### clients

Les clients confirmés. Un client peut avoir un compte utilisateur associé (pour accéder à son espace).

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | PK |
| company_name | TEXT | Nom de l'entreprise |
| firstname | TEXT | Prénom du contact |
| lastname | TEXT | Nom du contact |
| email | TEXT | Email (unique) |
| phone | TEXT | Téléphone |
| location | TEXT | Adresse |
| is_active | BOOLEAN | Client actif ou non |
| user_id | INTEGER | FK → users (compte associé) |
| created_at | TIMESTAMPTZ | Date de création |

### users

Les comptes de connexion. Trois rôles : admin, employe, client.

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | PK |
| email | VARCHAR(255) | Email de connexion (unique) |
| password_hash | VARCHAR(255) | Hash bcrypt du mot de passe |
| firstname | VARCHAR(100) | Prénom |
| lastname | VARCHAR(100) | Nom |
| role | VARCHAR(20) | admin / employe / client |
| is_active | BOOLEAN | Compte actif |
| must_change_password | BOOLEAN | Force le changement au prochain login |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Dernière modif |

Le lien entre un client et son compte user se fait via `clients.user_id`. On a choisi cette approche plutôt que l'inverse parce qu'un user peut exister sans être un client (admin ou employé).

### events

Les événements organisés.

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | PK |
| name | VARCHAR(255) | Nom de l'événement |
| description | TEXT | Description |
| event_type | ENUM | seminaire, conference, soiree_entreprise, team_building, inauguration, autre |
| theme | VARCHAR(100) | Thème |
| start_date | TIMESTAMPTZ | Date/heure de début |
| end_date | TIMESTAMPTZ | Date/heure de fin |
| location | VARCHAR(255) | Lieu |
| participants_count | INTEGER | Nombre de participants |
| image_url | TEXT | Image de l'événement |
| status | ENUM | brouillon, en_attente, accepte, en_cours, termine, annule |
| is_public | BOOLEAN | Visible sur la page publique |
| client_approved_public | BOOLEAN | Le client a validé la publication |
| client_id | INTEGER | FK → clients |
| created_by | INTEGER | FK → users |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Dernière modif |

### devis

Les devis envoyés aux clients. Chaque devis a une référence unique générée automatiquement (format DEV-2026-0001).

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | PK |
| reference | VARCHAR(50) | Référence unique |
| client_id | INTEGER | FK → clients (NOT NULL) |
| event_id | INTEGER | FK → events (optionnel) |
| status | ENUM | brouillon, envoye, en_etude, modification, accepte, refuse |
| total_ht | DECIMAL(12,2) | Total HT |
| total_tva | DECIMAL(12,2) | Total TVA |
| total_ttc | DECIMAL(12,2) | Total TTC |
| valid_until | DATE | Date limite de validité |
| custom_message | TEXT | Message personnalisé |
| modification_reason | TEXT | Si le client demande une modif |
| sent_at | TIMESTAMPTZ | Date d'envoi |
| accepted_at | TIMESTAMPTZ | Date d'acceptation |
| refused_at | TIMESTAMPTZ | Date de refus |
| created_by | INTEGER | FK → users |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Dernière modif |

### lignes_devis

Les lignes de prestation d'un devis.

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | PK |
| devis_id | INTEGER | FK → devis (CASCADE) |
| label | VARCHAR(255) | Nom de la prestation |
| description | TEXT | Détails |
| quantity | INTEGER | Quantité |
| unit_price_ht | DECIMAL(10,2) | Prix unitaire HT |
| tva_rate | DECIMAL(4,2) | Taux TVA (défaut 20%) |
| total_ht | DECIMAL(10,2) | Total HT de la ligne |
| total_tva | DECIMAL(10,2) | TVA de la ligne |
| total_ttc | DECIMAL(10,2) | TTC de la ligne |
| sort_order | INTEGER | Ordre d'affichage |
| created_at | TIMESTAMPTZ | Date de création |

## Tables secondaires

### prestations

Services liés à un événement (différent des lignes de devis).

| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | PK |
| event_id | INTEGER | FK → events (CASCADE) |
| label | VARCHAR(255) | Libellé |
| amount_ht | DECIMAL(10,2) | Montant HT |
| tva_rate | DECIMAL(4,2) | TVA |
| created_at | TIMESTAMPTZ | Date de création |

### contact_messages

Messages reçus via le formulaire de contact public.

| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGSERIAL | PK |
| firstname | VARCHAR(100) | Prénom |
| lastname | VARCHAR(100) | Nom |
| email | VARCHAR(255) | Email |
| phone | VARCHAR(50) | Téléphone |
| subject | VARCHAR(255) | Sujet |
| message | TEXT | Contenu |
| is_read | BOOLEAN | Lu par l'admin |
| is_archived | BOOLEAN | Archivé |
| user_id | BIGINT | FK → users (si connecté) |
| created_at | TIMESTAMPTZ | Date d'envoi |

### reviews

Avis clients sur les événements.

| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGSERIAL | PK |
| client_id | BIGINT | FK → clients |
| event_id | BIGINT | FK → events |
| author_name | VARCHAR(100) | Nom affiché |
| author_company | VARCHAR(255) | Entreprise |
| rating | INTEGER | Note de 1 à 5 |
| title | VARCHAR(255) | Titre de l'avis |
| content | TEXT | Contenu |
| status | VARCHAR(50) | en_attente, valide, refuse |
| validated_by | BIGINT | FK → users |
| validated_at | TIMESTAMPTZ | Date de validation |
| is_featured | BOOLEAN | Mis en avant sur le site |
| created_at | TIMESTAMPTZ | Date de création |

### notes et tasks

Pour le suivi interne des événements. Les employés peuvent ajouter des notes et créer des tâches.

**Notes** : contenu libre lié à un événement (ou note globale)
**Tasks** : tâches assignables avec statut (a_faire, en_cours, terminee) et priorité

## Relations et cardinalités

| Relation | Cardinalité | Explication |
|----------|-------------|-------------|
| prospects → clients | 0,1:1 | Un prospect peut devenir un client |
| clients → users | 0,1:1 | Un client peut avoir un compte |
| clients → events | 1:N | Un client peut avoir plusieurs events |
| clients → devis | 1:N | Un client peut avoir plusieurs devis |
| events → prestations | 1:N | Un event a plusieurs prestations |
| events → notes | 1:N | Un event a plusieurs notes |
| events → tasks | 1:N | Un event a plusieurs tâches |
| devis → lignes_devis | 1:N | Un devis a plusieurs lignes |
| users → events | 1:N | Un user peut créer plusieurs events |
| users → tasks | 1:N | Un user peut être assigné à plusieurs tâches |

## Types énumérés

PostgreSQL utilise des types ENUM pour certaines colonnes :

```sql
-- Types d'événements
CREATE TYPE event_type AS ENUM (
  'seminaire', 'conference', 'soiree_entreprise',
  'team_building', 'inauguration', 'autre'
);

-- Statuts d'événement
CREATE TYPE event_status AS ENUM (
  'brouillon', 'en_attente', 'accepte',
  'en_cours', 'termine', 'annule'
);

-- Statuts de tâche
CREATE TYPE task_status AS ENUM (
  'a_faire', 'en_cours', 'termine'
);

-- Statuts de devis
CREATE TYPE devis_status AS ENUM (
  'brouillon', 'envoye', 'en_etude',
  'modification', 'accepte', 'refuse'
);
```

## Comportements ON DELETE

On a fait attention aux cascades pour éviter les orphelins :

| FK | Action | Pourquoi |
|----|--------|----------|
| lignes_devis.devis_id | CASCADE | Si on supprime un devis les lignes partent avec |
| prestations.event_id | CASCADE | Pareil pour les prestations d'un event |
| devis.client_id | RESTRICT | On empêche de supprimer un client qui a des devis |
| events.client_id | SET NULL | Si on supprime un client l'event reste mais sans client |

## Journalisation MongoDB

En plus de PostgreSQL on utilise MongoDB pour les logs. Chaque action importante est enregistrée dans la collection `logs` avec :

```javascript
{
  horodatage: ISODate("..."),
  type_action: "CONNEXION_REUSSIE",
  id_utilisateur: 1,
  details: {
    ip: "192.168.1.1"
  }
}
```

Types d'actions loguées : CONNEXION_REUSSIE, CONNEXION_ECHOUEE, CREATION_COMPTE, CREATION_UTILISATEUR_ADMIN, DESACTIVATION_COMPTE, MODIFICATION_UTILISATEUR, etc.
