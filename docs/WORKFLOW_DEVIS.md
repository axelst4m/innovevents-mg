# Workflow de gestion des devis

## Vue d'ensemble

Ce document décrit le flux complet de gestion des devis, de la demande initiale par un prospect jusqu'à l'acceptation finale par le client.

---

## 1. Demande de devis (Prospect)

### Acteur : Visiteur / Client potentiel
### Page : `/demande-devis`

1. Le visiteur remplit le formulaire de demande de devis avec :
   - Nom de l'entreprise
   - Prénom / Nom
   - Email
   - Téléphone
   - Lieu
   - Type d'événement (Séminaire, Conférence, Soirée d'entreprise, Autre)
   - Date souhaitée
   - Nombre de participants
   - Message décrivant le besoin

2. **Si l'utilisateur est connecté** : les champs Prénom, Nom et Email sont pré-remplis automatiquement.

3. À la soumission, un **prospect** est créé en base de données avec le statut `a_contacter`.

### Données créées :
- Table `prospects` : nouvelle entrée avec toutes les informations du formulaire

---

## 2. Traitement du prospect (Admin)

### Acteur : Administrateur
### Page : `/admin/prospects`

1. L'admin consulte la liste des prospects (filtrée par défaut sur "À contacter")

2. L'admin clique sur **"Voir"** pour consulter le détail d'un prospect

3. L'admin peut :
   - Changer le statut : "Contacté", "Qualifié", "Refusé"
   - **Convertir en client** : bouton bleu "Convertir en client"

### Lors de la conversion en client :

La conversion crée automatiquement :

1. **Un client** dans la table `clients` avec les infos du prospect
2. **Un devis brouillon** dans la table `devis` avec :
   - Référence auto-générée (ex: `DEV-2026-0001`)
   - Statut : `brouillon`
   - Message personnalisé contenant les infos de la demande initiale :
     ```
     Demande initiale du 19/01/2026:
     - Type d'événement: Séminaire
     - Date souhaitée: 2026-03-15
     - Nombre de participants: 50

     Message du client:
     Nous souhaitons organiser un séminaire de team building...
     ```
   - Validité : 30 jours par défaut

3. Le prospect est marqué comme converti (`client_id` renseigné, statut `qualifie`)

### Après conversion :

- Le bouton "Convertir en client" devient grisé (déjà converti)
- Le bouton **"Compléter le devis (DEV-XXXX-XXXX)"** devient actif

---

## 3. Complétion du devis (Admin)

### Acteur : Administrateur
### Page : `/admin/devis`

1. L'admin clique sur **"Compléter le devis"** depuis la fiche prospect, ou accède directement à `/admin/devis`

2. Le détail du devis s'ouvre automatiquement

3. L'admin ajoute les **lignes de prestations** :
   - Description (ex: "Location salle de conférence")
   - Quantité
   - Prix unitaire HT
   - Taux de TVA (20%, 10%, 5.5%, 0%)

4. Les totaux (HT, TVA, TTC) sont calculés automatiquement par un **trigger PostgreSQL**

5. L'admin peut :
   - Modifier le message personnalisé
   - Associer un événement existant
   - Modifier la date de validité

---

## 4. Envoi du devis (Admin)

### Acteur : Administrateur
### Page : `/admin/devis` (détail du devis)

1. L'admin clique sur **"Envoyer au client"**

2. Vérifications effectuées :
   - Le devis doit contenir au moins une ligne de prestation

3. **Si le client n'a pas de compte utilisateur** :
   - Une alerte s'affiche : *"Devis envoyé. Note: ce client n'a pas encore de compte. Il devra s'inscrire avec l'email xxx@xxx.fr pour consulter son devis en ligne."*

4. Le statut du devis passe à `envoye`

5. La date d'envoi (`sent_at`) est enregistrée

### TODO (non implémenté) :
- Envoi réel d'un email avec le PDF en pièce jointe

---

## 5. Création de compte client (Client)

### Acteur : Client
### Page : `/inscription`

1. Le client s'inscrit avec **le même email** que celui utilisé dans sa demande de devis

2. **Liaison automatique** : si un client existe en base avec cet email (sans compte), le compte utilisateur est automatiquement lié au client

3. Message de confirmation : *"Compte créé avec succès. Votre espace client (Nom Entreprise) a été lié à votre compte."*

---

## 6. Consultation et réponse au devis (Client)

### Acteur : Client connecté
### Page : `/espace-client/devis`

1. Le client voit tous ses devis (liés via `clients.user_id`)

2. Pour chaque devis, il peut voir :
   - La référence
   - Le statut
   - L'événement associé (si applicable)
   - Le montant total TTC
   - La date de création

3. En cliquant sur **"Voir le détail"**, le client peut :
   - Consulter toutes les lignes de prestations
   - Télécharger le PDF
   - **Accepter** le devis
   - **Demander une modification** (avec motif)
   - **Refuser** le devis

### Actions possibles (si statut = `envoye` ou `en_etude`) :

#### Accepter
- Le statut passe à `accepte`
- La date d'acceptation est enregistrée
- Si un événement est lié, son statut passe aussi à `accepte`

#### Demander une modification
- Le client doit saisir un motif
- Le statut passe à `modification`
- Le motif est enregistré dans `modification_reason`
- L'admin peut alors modifier le devis et le renvoyer

#### Refuser
- Le statut passe à `refuse`
- La date de refus est enregistrée

---

## 7. Génération PDF

### Disponible pour : Admin, Employé, Client (propriétaire du devis)
### Route : `GET /api/devis/:id/pdf`

Le PDF est généré dynamiquement avec **PDFKit** et contient :
- En-tête avec logo et infos Innov'Events
- Informations du client
- Référence et date du devis
- Tableau des prestations
- Totaux HT, TVA, TTC
- Conditions générales
- Pied de page

---

## Schéma récapitulatif

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WORKFLOW DEVIS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  VISITEUR                      ADMIN                         CLIENT
     │                            │                              │
     │  1. Demande de devis       │                              │
     │  (/demande-devis)          │                              │
     │─────────────────────────>  │                              │
     │                            │                              │
     │                   2. Consulte prospect                    │
     │                   (/admin/prospects)                      │
     │                            │                              │
     │                   3. Convertit en client                  │
     │                      → Crée client                        │
     │                      → Crée devis brouillon               │
     │                            │                              │
     │                   4. Complète le devis                    │
     │                   (/admin/devis)                          │
     │                      → Ajoute prestations                 │
     │                            │                              │
     │                   5. Envoie le devis                      │
     │                      → Statut: "envoyé"                   │
     │                            │                              │
     │                            │  ┌─────────────────────────┐ │
     │                            │  │ 6. Inscription          │ │
     │                            │  │ (même email)            │ │
     │                            │  │ → Liaison auto          │ │
     │                            │  └─────────────────────────┘ │
     │                            │                              │
     │                            │         7. Consulte devis    │
     │                            │         (/espace-client/devis)
     │                            │                              │
     │                            │         8. Répond au devis   │
     │                            │            ├─ Accepter       │
     │                            │            ├─ Modifier       │
     │                            │            └─ Refuser        │
     │                            │                              │
     │                   ┌────────┴────────┐                     │
     │                   │ Si modification │                     │
     │                   │ → Retour étape 4│                     │
     │                   └─────────────────┘                     │
```

---

## Statuts des devis

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| `brouillon` | Devis en cours de création | Modifier, Ajouter lignes, Envoyer |
| `envoye` | Devis envoyé au client | Client: Accepter, Modifier, Refuser |
| `en_etude` | Client consulte le devis | Client: Accepter, Modifier, Refuser |
| `modification` | Client demande des modifications | Admin: Modifier et renvoyer |
| `accepte` | Devis accepté par le client | Aucune (final) |
| `refuse` | Devis refusé par le client | Aucune (final) |

---

## Tables concernées

- `prospects` : demandes de devis initiales
- `clients` : clients convertis
- `users` : comptes utilisateurs (liaison via `clients.user_id`)
- `devis` : devis avec statut, totaux, dates
- `lignes_devis` : lignes de prestations
- `events` : événements (optionnel, liaison via `devis.event_id`)

---

## Fichiers de code concernés

### Backend (API)
- `apps/api/src/routes/prospects.js` : gestion des prospects et conversion
- `apps/api/src/routes/devis.js` : CRUD devis, envoi, acceptation, PDF
- `apps/api/src/routes/auth.js` : inscription avec liaison auto client
- `apps/api/src/utils/pdfGenerator.js` : génération du PDF

### Frontend (React)
- `apps/web/src/pages/QuoteRequest.jsx` : formulaire demande de devis
- `apps/web/src/pages/AdminProspects.jsx` : gestion des prospects
- `apps/web/src/pages/AdminDevis.jsx` : gestion des devis (admin)
- `apps/web/src/pages/ClientDevis.jsx` : espace client devis

### Base de données
- `docs/database/005_devis.sql` : tables et triggers
